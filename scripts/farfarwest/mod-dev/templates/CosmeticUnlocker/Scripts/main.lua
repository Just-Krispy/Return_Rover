local MOD_NAME = "CosmeticUnlocker"
local SETTINGS_PATH = "ue4ss/Mods/CosmeticUnlocker/config/settings.json"

local settings = {
    enabled = true,
    discoveryOnly = true,
    unlockLocalCandidates = false,
    scanIntervalMs = 5000,
    maxLoggedCandidates = 80,
    maxUnlocksPerScan = 40,
    debug = true,
}

local loggedCandidates = {}
local totalLoggedCandidates = 0
local totalUnlocked = 0
local scanCount = 0

local includeTerms = {
    "cosmetic",
    "fashion",
    "skin",
    "outfit",
    "wardrobe",
    "clothing",
    "cloth",
    "hat",
    "hair",
    "body",
    "face",
    "avatar",
    "appearance",
    "customization",
    "customisation",
}

local unlockTerms = {
    "unlocked",
    "isunlocked",
    "owned",
    "isowned",
    "purchased",
    "ispurchased",
    "available",
    "isavailable",
}

local excludedTerms = {
    "dlc",
    "premium",
    "entitlement",
    "microtransaction",
    "mtx",
    "realmoney",
    "cashshop",
    "storepurchase",
    "steam",
    "epic",
    "eos",
    "online",
    "backend",
    "server",
    "network",
    "receipt",
    "license",
    "licence",
    "achievement",
}

local function Log(message)
    print(string.format("[%s] %s\n", MOD_NAME, tostring(message)))
end

local function lower(value)
    return string.lower(tostring(value or ""))
end

local function containsAny(text, terms)
    local normalized = lower(text)
    for _, term in ipairs(terms) do
        if string.find(normalized, term, 1, true) then
            return true
        end
    end
    return false
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

    local function boolValue(key, current)
        local value = string.match(content, '"' .. key .. '"%s*:%s*(%a+)')
        if value == "true" then return true end
        if value == "false" then return false end
        return current
    end

    local function numberValue(key, current)
        local value = string.match(content, '"' .. key .. '"%s*:%s*(%d+)')
        return value and tonumber(value) or current
    end

    settings.enabled = boolValue("enabled", settings.enabled)
    settings.discoveryOnly = boolValue("discoveryOnly", settings.discoveryOnly)
    settings.unlockLocalCandidates = boolValue("unlockLocalCandidates", settings.unlockLocalCandidates)
    settings.debug = boolValue("debug", settings.debug)
    settings.scanIntervalMs = numberValue("scanIntervalMs", settings.scanIntervalMs)
    settings.maxLoggedCandidates = numberValue("maxLoggedCandidates", settings.maxLoggedCandidates)
    settings.maxUnlocksPerScan = numberValue("maxUnlocksPerScan", settings.maxUnlocksPerScan)
end

local function isValidObject(object)
    local ok, valid = pcall(function()
        return object and object:IsValid()
    end)
    return ok and valid
end

local function getFullName(object)
    local ok, fullName = pcall(function()
        return object:GetFullName()
    end)
    return ok and tostring(fullName) or ""
end

local function propertyName(property)
    local ok, name = pcall(function()
        return property:GetFName():ToString()
    end)
    return ok and tostring(name) or nil
end

local function isBoolProperty(property)
    local ok, result = pcall(function()
        return PropertyTypes and PropertyTypes.BoolProperty and property:IsA(PropertyTypes.BoolProperty)
    end)
    return ok and result
end

local function isCandidateObject(fullName)
    if fullName == "" then
        return false
    end
    if containsAny(fullName, excludedTerms) then
        return false
    end
    return containsAny(fullName, includeTerms)
end

local function isCandidateProperty(fullName, name)
    local combined = fullName .. "." .. tostring(name or "")
    if containsAny(combined, excludedTerms) then
        return false
    end
    return containsAny(fullName, includeTerms) and containsAny(name, unlockTerms)
end

local function logCandidate(fullName, name, value)
    if totalLoggedCandidates >= settings.maxLoggedCandidates then
        return
    end

    local key = fullName .. "." .. tostring(name)
    if loggedCandidates[key] then
        return
    end

    loggedCandidates[key] = true
    totalLoggedCandidates = totalLoggedCandidates + 1
    Log(string.format("Candidate #%s: %s.%s=%s", tostring(totalLoggedCandidates), fullName, tostring(name), tostring(value)))
end

local function scanClass(className)
    local ok, objects = pcall(function()
        return FindAllOf(className)
    end)
    if not ok or not objects then
        return 0
    end

    local unlocksThisScan = 0
    for _, object in ipairs(objects) do
        if unlocksThisScan >= settings.maxUnlocksPerScan then
            break
        end

        if isValidObject(object) then
            local fullName = getFullName(object)
            if isCandidateObject(fullName) then
                local classOk, class = pcall(function()
                    return object:GetClass()
                end)

                if classOk and isValidObject(class) then
                    pcall(function()
                        class:ForEachProperty(function(property)
                            if unlocksThisScan >= settings.maxUnlocksPerScan then
                                return
                            end

                            local name = propertyName(property)
                            if name and isCandidateProperty(fullName, name) then
                                local valueOk, value = pcall(function()
                                    return object[name]
                                end)

                                if valueOk and type(value) == "boolean" then
                                    logCandidate(fullName, name, value)

                                    if settings.unlockLocalCandidates and not settings.discoveryOnly and value == false and isBoolProperty(property) then
                                        local setOk = pcall(function()
                                            object[name] = true
                                        end)
                                        if setOk then
                                            unlocksThisScan = unlocksThisScan + 1
                                            totalUnlocked = totalUnlocked + 1
                                            Log(string.format("Set local candidate true: %s.%s", fullName, name))
                                        end
                                    end
                                end
                            end
                        end)
                    end)
                end
            end
        end
    end

    return unlocksThisScan
end

local function scanCosmetics()
    local classNames = {
        "Object",
        "UserWidget",
        "Widget",
        "BP_CanyonGameInstance_C",
        "BP_GameState_C",
        "BP_PlayerState_C",
        "BP_PlayerController_C",
        "BP_Player_C",
        "UI_Player_C",
    }

    local unlockedThisScan = 0
    for _, className in ipairs(classNames) do
        unlockedThisScan = unlockedThisScan + scanClass(className)
        if unlockedThisScan >= settings.maxUnlocksPerScan then
            break
        end
    end

    return unlockedThisScan
end

loadSettings()
Log(string.format(
    "Loaded. discoveryOnly=%s unlockLocalCandidates=%s. Paid/DLC/online-looking names are excluded.",
    tostring(settings.discoveryOnly),
    tostring(settings.unlockLocalCandidates)
))

LoopAsync(settings.scanIntervalMs, function()
    if not settings.enabled then
        return false
    end

    scanCount = scanCount + 1
    local unlockedThisScan = scanCosmetics()

    if settings.debug then
        Log(string.format(
            "Scan %s complete. candidatesLogged=%s unlockedThisScan=%s totalUnlocked=%s.",
            tostring(scanCount),
            tostring(totalLoggedCandidates),
            tostring(unlockedThisScan),
            tostring(totalUnlocked)
        ))
    end

    return false
end)