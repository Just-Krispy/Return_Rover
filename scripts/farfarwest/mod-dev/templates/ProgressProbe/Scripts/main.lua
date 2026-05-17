local MOD_NAME = "ProgressProbe"
local SETTINGS_PATH = "ue4ss/Mods/ProgressProbe/config/settings.json"

local settings = {
    enabled = true,
    discoveryOnly = true,
    runDelayMs = 4000,
    scanIntervalMs = 2000,
    maxAttempts = 8,
    maxPropertyLogsPerType = 180,
    maxFunctionLogsPerType = 200,
    maxDirectScalarLogs = 120,
    maxContainerLogs = 60,
    maxNestedStructScalarLogs = 120,
    maxNestedArrayStructEntries = 6,
    maxContainerEntries = 3,
    debug = false,
}

local targetClassNames = {
    "BP_CanyonGameInstance_C",
    "SG_PlayerProgress_C",
}

local targetStructPaths = {
    "/Game/Player/SaveGames/S_PlayerProgress.S_PlayerProgress",
    "/Game/Player/SaveGames/S_PlayerSelectedItems.S_PlayerSelectedItems",
    "/Game/Player/SaveGames/S_RuntimeInventory.S_RuntimeInventory",
    "/Game/Progress/S_PlayerSkins.S_PlayerSkins",
}

local keywords = {
    "save",
    "load",
    "progress",
    "gold",
    "money",
    "currency",
    "skin",
    "unlock",
    "purchase",
    "buy",
    "update",
    "player",
}

local structLookup = {}
local classComplete = {}
local structsEnumerated = false
local attempts = 0
local started = false
local probeDone = false
local hookCandidates = {}
local hookCandidateSeen = {}

local function Log(message)
    print(string.format("[%s] %s\n", MOD_NAME, tostring(message)))
end

local function Debug(message)
    if settings.debug then
        Log("DEBUG: " .. tostring(message))
    end
end

local function lower(value)
    return string.lower(tostring(value or ""))
end

local function boolFromJson(content, key, current)
    local value = string.match(content, '"' .. key .. '"%s*:%s*(%a+)')
    if value == "true" then return true end
    if value == "false" then return false end
    return current
end

local function numberFromJson(content, key, current)
    local value = string.match(content, '"' .. key .. '"%s*:%s*(%d+)')
    return value and tonumber(value) or current
end

local function loadSettings()
    local ok, file = pcall(function()
        return io.open(SETTINGS_PATH, "r")
    end)
    if not ok or not file then
        return
    end

    local content = file:read("*a")
    file:close()

    settings.enabled = boolFromJson(content, "enabled", settings.enabled)
    settings.discoveryOnly = boolFromJson(content, "discoveryOnly", settings.discoveryOnly)
    settings.debug = boolFromJson(content, "debug", settings.debug)
    settings.runDelayMs = numberFromJson(content, "runDelayMs", settings.runDelayMs)
    settings.scanIntervalMs = numberFromJson(content, "scanIntervalMs", settings.scanIntervalMs)
    settings.maxAttempts = numberFromJson(content, "maxAttempts", settings.maxAttempts)
    settings.maxPropertyLogsPerType = numberFromJson(content, "maxPropertyLogsPerType", settings.maxPropertyLogsPerType)
    settings.maxFunctionLogsPerType = numberFromJson(content, "maxFunctionLogsPerType", settings.maxFunctionLogsPerType)
    settings.maxDirectScalarLogs = numberFromJson(content, "maxDirectScalarLogs", settings.maxDirectScalarLogs)
    settings.maxContainerLogs = numberFromJson(content, "maxContainerLogs", settings.maxContainerLogs)
    settings.maxNestedStructScalarLogs = numberFromJson(content, "maxNestedStructScalarLogs", settings.maxNestedStructScalarLogs)
    settings.maxNestedArrayStructEntries = numberFromJson(content, "maxNestedArrayStructEntries", settings.maxNestedArrayStructEntries)
    settings.maxContainerEntries = numberFromJson(content, "maxContainerEntries", settings.maxContainerEntries)
end

local function isValidObject(object)
    local ok, valid = pcall(function()
        return object and object:IsValid()
    end)
    return ok and valid
end

local function toStringValue(value)
    if value == nil then
        return "<nil>"
    end

    local valueType = type(value)
    if valueType == "number" or valueType == "boolean" then
        return tostring(value)
    end

    if valueType == "string" then
        return value
    end

    local toStringOk, toStringValueResult = pcall(function()
        return value:ToString()
    end)
    if toStringOk and toStringValueResult then
        return tostring(toStringValueResult)
    end

    local fullNameOk, fullName = pcall(function()
        return value:GetFullName()
    end)
    if fullNameOk and fullName then
        return tostring(fullName)
    end

    local tostringOk, plainText = pcall(function()
        return tostring(value)
    end)
    if tostringOk then
        return plainText
    end

    return "<unreadable>"
end

local function propertyName(property)
    local ok, name = pcall(function()
        return property:GetFName():ToString()
    end)
    return ok and name or nil
end

local function functionName(func)
    local ok, name = pcall(function()
        return func:GetFName():ToString()
    end)
    return ok and name or nil
end

local function functionFullName(func)
    local ok, fullName = pcall(function()
        return func:GetFullName()
    end)
    return ok and fullName or nil
end

local function containsKeyword(value)
    local text = lower(value)
    for _, keyword in ipairs(keywords) do
        if string.find(text, keyword, 1, true) then
            return true
        end
    end
    return false
end

local function keywordScore(value)
    local text = lower(value)
    local score = 0
    for _, keyword in ipairs(keywords) do
        if string.find(text, keyword, 1, true) then
            score = score + 1
        end
    end
    return score
end

local function normalizedStructPath(fullName)
    local text = tostring(fullName or "")
    local splitIndex = string.find(text, " ", 1, true)
    if splitIndex then
        return string.sub(text, splitIndex + 1)
    end
    return text
end

local function isTargetStructPath(path)
    if not path or path == "" then
        return false
    end

    local normalized = normalizedStructPath(path)
    return structLookup[path] ~= nil or structLookup[normalized] ~= nil
end

local function tryCallMethod(object, methodName)
    local ok, result = pcall(function()
        local method = object and object[methodName]
        if type(method) ~= "function" then
            return nil
        end
        return method(object)
    end)
    if not ok then
        return nil
    end
    return result
end

local function isPropertyA(property, propertyTypeName)
    local propertyType = PropertyTypes and PropertyTypes[propertyTypeName]
    if not propertyType then
        return false
    end

    local ok, result = pcall(function()
        return property:IsA(propertyType)
    end)
    return ok and result
end

local function propertyTypeSummary(property)
    local summary = "Property"

    local classNameOk, className = pcall(function()
        return property:GetClass():GetFName():ToString()
    end)
    if classNameOk and className then
        summary = tostring(className)
    end

    if isPropertyA(property, "ObjectProperty") then
        local classOk, objectClass = pcall(function()
            return property:GetPropertyClass()
        end)
        if classOk and isValidObject(objectClass) then
            summary = string.format("%s<%s>", summary, objectClass:GetFullName())
        end
    elseif isPropertyA(property, "StructProperty") then
        local structOk, structObj = pcall(function()
            return property:GetStruct()
        end)
        if structOk and isValidObject(structObj) then
            summary = string.format("%s<%s>", summary, structObj:GetFullName())
        end
    elseif isPropertyA(property, "ArrayProperty") then
        local innerOk, inner = pcall(function()
            return property:GetInner()
        end)
        if innerOk and inner then
            local innerName = propertyTypeSummary(inner)
            summary = string.format("%s<%s>", summary, innerName)
        end
    elseif isPropertyA(property, "MapProperty") then
        local keyProperty = tryCallMethod(property, "GetKeyProp")
            or tryCallMethod(property, "GetKeyProperty")
        local valueProperty = tryCallMethod(property, "GetValueProp")
            or tryCallMethod(property, "GetValueProperty")

        local keyType = keyProperty and propertyTypeSummary(keyProperty) or "<unknown>"
        local valueType = valueProperty and propertyTypeSummary(valueProperty) or "<unknown>"
        summary = string.format("%s<key=%s,value=%s>", summary, keyType, valueType)
    end

    return summary
end

local function isScalarProperty(property)
    return isPropertyA(property, "Int8Property")
        or isPropertyA(property, "Int16Property")
        or isPropertyA(property, "IntProperty")
        or isPropertyA(property, "Int64Property")
        or isPropertyA(property, "UInt16Property")
        or isPropertyA(property, "UIntProperty")
        or isPropertyA(property, "UInt64Property")
        or isPropertyA(property, "FloatProperty")
        or isPropertyA(property, "DoubleProperty")
        or isPropertyA(property, "BoolProperty")
        or isPropertyA(property, "ByteProperty")
        or isPropertyA(property, "NameProperty")
        or isPropertyA(property, "StrProperty")
        or isPropertyA(property, "TextProperty")
        or isPropertyA(property, "EnumProperty")
end

local function summarizeLooseValue(value)
    if value == nil then
        return "<nil>"
    end

    local valueType = type(value)
    if valueType == "number" or valueType == "boolean" or valueType == "string" then
        return tostring(value)
    end

    local fullNameOk, fullName = pcall(function()
        return value:GetFullName()
    end)
    if fullNameOk and fullName then
        return tostring(fullName)
    end

    local toStringOk, text = pcall(function()
        return value:ToString()
    end)
    if toStringOk and text then
        return tostring(text)
    end

    return toStringValue(value)
end

local function summarizeArrayValue(value, property)
    local arrayNumOk, arrayNum = pcall(function()
        return value:GetArrayNum()
    end)
    local arrayMaxOk, arrayMax = pcall(function()
        return value:GetArrayMax()
    end)

    local countText = arrayNumOk and tostring(arrayNum) or "?"
    local maxText = arrayMaxOk and tostring(arrayMax) or "?"
    local summary = string.format("size=%s max=%s", countText, maxText)

    local innerText = nil
    local innerOk, inner = pcall(function()
        return property:GetInner()
    end)
    if innerOk and inner then
        innerText = propertyTypeSummary(inner)
        summary = summary .. " inner=" .. innerText
    end

    local samples = {}
    local sampleCount = 0
    pcall(function()
        value:ForEach(function(index, element)
            if sampleCount >= settings.maxContainerEntries then
                return true
            end

            local elementValue = element
            local unwrapOk, unwrapped = pcall(function()
                return element:get()
            end)
            if unwrapOk then
                elementValue = unwrapped
            end

            table.insert(samples, string.format("[%s]=%s", tostring(index - 1), summarizeLooseValue(elementValue)))
            sampleCount = sampleCount + 1
        end)
    end)

    if #samples > 0 then
        summary = summary .. " samples={" .. table.concat(samples, ", ") .. "}"
    end

    return summary
end

local function summarizeMapValue(value, property)
    local sizeText = "?"
    local sizeOk, size = pcall(function()
        return #value
    end)
    if sizeOk then
        sizeText = tostring(size)
    end

    local keyProperty = tryCallMethod(property, "GetKeyProp")
        or tryCallMethod(property, "GetKeyProperty")
    local valueProperty = tryCallMethod(property, "GetValueProp")
        or tryCallMethod(property, "GetValueProperty")

    local keyType = keyProperty and propertyTypeSummary(keyProperty) or "<unknown>"
    local valueType = valueProperty and propertyTypeSummary(valueProperty) or "<unknown>"
    local summary = string.format("size=%s key=%s value=%s", sizeText, keyType, valueType)

    local samples = {}
    local sampleCount = 0
    pcall(function()
        value:ForEach(function(key, entryValue)
            if sampleCount >= settings.maxContainerEntries then
                return true
            end

            local resolvedKey = key
            local resolvedValue = entryValue

            local keyOk, keyUnwrap = pcall(function()
                return key:get()
            end)
            if keyOk then
                resolvedKey = keyUnwrap
            end

            local valueOk, valueUnwrap = pcall(function()
                return entryValue:get()
            end)
            if valueOk then
                resolvedValue = valueUnwrap
            end

            table.insert(samples, string.format("[%s]=%s", summarizeLooseValue(resolvedKey), summarizeLooseValue(resolvedValue)))
            sampleCount = sampleCount + 1
        end)
    end)

    if #samples > 0 then
        summary = summary .. " samples={" .. table.concat(samples, ", ") .. "}"
    end

    return summary
end

local function gatherPropertyEntries(structObject)
    local entries = {}
    local iterated = pcall(function()
        structObject:ForEachProperty(function(property)
            local name = propertyName(property)
            if name then
                local entry = {
                    name = name,
                    score = keywordScore(name),
                    property = property,
                    typeSummary = propertyTypeSummary(property),
                }

                local offsetOk, offset = pcall(function()
                    return property:GetOffset_Internal()
                end)
                if offsetOk then
                    entry.offset = offset
                end

                table.insert(entries, entry)
            end
        end)
    end)

    if not iterated then
        return entries
    end

    table.sort(entries, function(left, right)
        if left.score ~= right.score then
            return left.score > right.score
        end
        return left.name < right.name
    end)

    return entries
end

local function gatherFunctionEntries(structObject)
    local entries = {}
    local iterated = pcall(function()
        structObject:ForEachFunction(function(func)
            local shortName = functionName(func)
            if shortName then
                local fullName = functionFullName(func) or shortName
                local combined = tostring(shortName) .. " " .. tostring(fullName)
                table.insert(entries, {
                    shortName = shortName,
                    fullName = fullName,
                    score = keywordScore(combined),
                })
            end
        end)
    end)

    if not iterated then
        return entries
    end

    table.sort(entries, function(left, right)
        if left.score ~= right.score then
            return left.score > right.score
        end
        return left.shortName < right.shortName
    end)

    return entries
end

local function addHookCandidate(ownerLabel, functionEntry)
    if functionEntry.score <= 0 then
        return
    end

    local fullName = tostring(functionEntry.fullName)
    local hookPath = string.gsub(fullName, "^Function%s+", "")
    local candidateKey = hookPath
    if hookCandidateSeen[candidateKey] then
        return
    end

    hookCandidateSeen[candidateKey] = true
    table.insert(hookCandidates, {
        ownerLabel = ownerLabel,
        score = functionEntry.score,
        fullName = fullName,
        hookPath = hookPath,
    })
end

local function logMetadataForStruct(ownerLabel, structObject)
    local properties = gatherPropertyEntries(structObject)
    local functions = gatherFunctionEntries(structObject)

    Log(string.format("%s: properties=%s functions=%s", ownerLabel, tostring(#properties), tostring(#functions)))

    local propertyLogged = 0
    for _, entry in ipairs(properties) do
        if propertyLogged >= settings.maxPropertyLogsPerType then
            break
        end

        if entry.score > 0 or propertyLogged < 24 then
            local marker = entry.score > 0 and "*" or "-"
            local offsetText = entry.offset and string.format("0x%X", entry.offset) or "?"
            Log(string.format("%s %s prop %s [%s] offset=%s", marker, ownerLabel, entry.name, entry.typeSummary, offsetText))
            propertyLogged = propertyLogged + 1
        end
    end

    local functionLogged = 0
    for _, entry in ipairs(functions) do
        if functionLogged >= settings.maxFunctionLogsPerType then
            break
        end

        if entry.score > 0 or functionLogged < 18 then
            local marker = entry.score > 0 and "*" or "-"
            Log(string.format("%s %s fn %s", marker, ownerLabel, tostring(entry.fullName)))
            functionLogged = functionLogged + 1
        end

        addHookCandidate(ownerLabel, entry)
    end
end

local function inspectStructValue(ownerLabel, structName, structValue, structObject, depth)
    if depth > 2 then
        return
    end

    local properties = gatherPropertyEntries(structObject)
    local scalarLogged = 0
    local containerLogged = 0

    for _, entry in ipairs(properties) do
        if scalarLogged >= settings.maxNestedStructScalarLogs and containerLogged >= settings.maxContainerLogs then
            break
        end

        local readOk, value = pcall(function()
            return structValue[entry.name]
        end)
        if not readOk then
            goto continue
        end

        if isScalarProperty(entry.property) and scalarLogged < settings.maxNestedStructScalarLogs then
            Log(string.format("* %s.%s=%s", ownerLabel, entry.name, toStringValue(value)))
            scalarLogged = scalarLogged + 1
        elseif isPropertyA(entry.property, "ArrayProperty") and containerLogged < settings.maxContainerLogs then
            local summary = summarizeArrayValue(value, entry.property)
            Log(string.format("* %s.%s [array] %s", ownerLabel, entry.name, summary))
            containerLogged = containerLogged + 1

            local innerOk, innerProperty = pcall(function()
                return entry.property:GetInner()
            end)
            if innerOk and innerProperty and isPropertyA(innerProperty, "StructProperty") and depth < 2 then
                local innerStructOk, innerStruct = pcall(function()
                    return innerProperty:GetStruct()
                end)
                if innerStructOk and isValidObject(innerStruct) then
                    local innerStructName = innerStruct:GetFullName()
                    if isTargetStructPath(innerStructName) then
                        local inspected = 0
                        pcall(function()
                            value:ForEach(function(index, element)
                                if inspected >= settings.maxNestedArrayStructEntries then
                                    return true
                                end

                                local elementValue = element
                                local unwrapOk, unwrapped = pcall(function()
                                    return element:get()
                                end)
                                if unwrapOk then
                                    elementValue = unwrapped
                                end

                                inspectStructValue(
                                    string.format("%s.%s[%s]", ownerLabel, entry.name, tostring(index - 1)),
                                    normalizedStructPath(innerStructName),
                                    elementValue,
                                    innerStruct,
                                    depth + 1
                                )

                                inspected = inspected + 1
                            end)
                        end)
                    end
                end
            end
        elseif isPropertyA(entry.property, "MapProperty") and containerLogged < settings.maxContainerLogs then
            local summary = summarizeMapValue(value, entry.property)
            Log(string.format("* %s.%s [map] %s", ownerLabel, entry.name, summary))
            containerLogged = containerLogged + 1
        elseif isPropertyA(entry.property, "StructProperty") then
            local nestedStructOk, nestedStruct = pcall(function()
                return entry.property:GetStruct()
            end)
            if nestedStructOk and isValidObject(nestedStruct) then
                local nestedName = nestedStruct:GetFullName()
                if isTargetStructPath(nestedName) then
                    Log(string.format("* %s.%s nested struct=%s", ownerLabel, entry.name, nestedName))
                end
            end
        end

        ::continue::
    end
end

local function findFirstInstance(className)
    local ok, objects = pcall(function()
        return FindAllOf(className)
    end)
    if not ok or not objects then
        return nil
    end

    for _, object in ipairs(objects) do
        if isValidObject(object) then
            return object
        end
    end

    return nil
end

local function probeClass(className)
    if classComplete[className] then
        return true
    end

    local instance = findFirstInstance(className)
    if not instance then
        Debug("No live instance yet for " .. className)
        return false
    end

    local classOk, classObject = pcall(function()
        return instance:GetClass()
    end)
    if not classOk or not isValidObject(classObject) then
        return false
    end

    local ownerLabel = "Class " .. className
    Log(string.format("%s live instance: %s", ownerLabel, toStringValue(instance:GetFullName())))
    logMetadataForStruct(ownerLabel, classObject)

    local properties = gatherPropertyEntries(classObject)
    local scalarLogged = 0
    local containerLogged = 0

    for _, entry in ipairs(properties) do
        if scalarLogged >= settings.maxDirectScalarLogs and containerLogged >= settings.maxContainerLogs then
            break
        end

        local readOk, value = pcall(function()
            return instance[entry.name]
        end)
        if not readOk then
            goto continue
        end

        if isScalarProperty(entry.property) and scalarLogged < settings.maxDirectScalarLogs then
            Log(string.format("* %s.%s=%s", ownerLabel, entry.name, toStringValue(value)))
            scalarLogged = scalarLogged + 1
        elseif isPropertyA(entry.property, "ArrayProperty") and containerLogged < settings.maxContainerLogs then
            local summary = summarizeArrayValue(value, entry.property)
            Log(string.format("* %s.%s [array] %s", ownerLabel, entry.name, summary))
            containerLogged = containerLogged + 1
        elseif isPropertyA(entry.property, "MapProperty") and containerLogged < settings.maxContainerLogs then
            local summary = summarizeMapValue(value, entry.property)
            Log(string.format("* %s.%s [map] %s", ownerLabel, entry.name, summary))
            containerLogged = containerLogged + 1
        elseif isPropertyA(entry.property, "StructProperty") then
            local structOk, structObject = pcall(function()
                return entry.property:GetStruct()
            end)
            if structOk and isValidObject(structObject) then
                local structName = structObject:GetFullName()
                local structPath = normalizedStructPath(structName)
                if isTargetStructPath(structName) then
                    Log(string.format("* %s.%s struct=%s", ownerLabel, entry.name, structName))
                    inspectStructValue(ownerLabel .. "." .. entry.name, structPath, value, structObject, 0)
                end
            end
        elseif entry.score > 0 and scalarLogged < settings.maxDirectScalarLogs then
            Log(string.format("* %s.%s=%s", ownerLabel, entry.name, toStringValue(value)))
            scalarLogged = scalarLogged + 1
        end

        ::continue::
    end

    classComplete[className] = true
    return true
end

local function probeStructMetadata()
    if structsEnumerated then
        return
    end

    for _, structPath in ipairs(targetStructPaths) do
        local foundStruct = nil
        local candidates = {
            structPath,
            "UserDefinedStruct " .. structPath,
            "ScriptStruct " .. structPath,
        }

        for _, candidate in ipairs(candidates) do
            local ok, structObject = pcall(function()
                return StaticFindObject(candidate)
            end)
            if ok and isValidObject(structObject) then
                foundStruct = structObject
                break
            end
        end

        if foundStruct then
            local fullName = foundStruct:GetFullName()
            local normalized = normalizedStructPath(fullName)
            structLookup[normalized] = true
            structLookup[fullName] = true
            Log(string.format("Struct metadata found: %s", fullName))
            logMetadataForStruct("Struct " .. normalized, foundStruct)
        else
            Log(string.format("Struct metadata missing: %s", structPath))
            structLookup[structPath] = true
        end
    end

    structsEnumerated = true
end

local function allClassProbesComplete()
    for _, className in ipairs(targetClassNames) do
        if not classComplete[className] then
            return false
        end
    end
    return true
end

local function emitHookCandidates()
    if #hookCandidates == 0 then
        Log("No prioritized hook candidates found from reflected function names.")
        return
    end

    table.sort(hookCandidates, function(left, right)
        if left.score ~= right.score then
            return left.score > right.score
        end
        return left.hookPath < right.hookPath
    end)

    Log("Suggested next hook candidates (discovery-only):")
    local logged = 0
    for _, candidate in ipairs(hookCandidates) do
        if logged >= 20 then
            break
        end
        Log(string.format("* [%s] score=%s %s", candidate.ownerLabel, tostring(candidate.score), candidate.hookPath))
        logged = logged + 1
    end
end

local function runProbeAttempt()
    if probeDone then
        return
    end

    attempts = attempts + 1
    Log(string.format("Probe attempt %s/%s", tostring(attempts), tostring(settings.maxAttempts)))

    probeStructMetadata()
    for _, className in ipairs(targetClassNames) do
        probeClass(className)
    end

    if allClassProbesComplete() or attempts >= settings.maxAttempts then
        probeDone = true
        emitHookCandidates()
        Log("ProgressProbe complete.")
    end
end

loadSettings()

for _, structPath in ipairs(targetStructPaths) do
    structLookup[structPath] = true
end

Log(string.format(
    "Loaded. enabled=%s discoveryOnly=%s runDelayMs=%s scanIntervalMs=%s maxAttempts=%s",
    tostring(settings.enabled),
    tostring(settings.discoveryOnly),
    tostring(settings.runDelayMs),
    tostring(settings.scanIntervalMs),
    tostring(settings.maxAttempts)
))

LoopAsync(settings.scanIntervalMs, function()
    if not settings.enabled then
        return false
    end

    if not started then
        started = true
        ExecuteWithDelay(settings.runDelayMs, function()
            runProbeAttempt()
        end)
        return false
    end

    if probeDone then
        return true
    end

    runProbeAttempt()
    return false
end)