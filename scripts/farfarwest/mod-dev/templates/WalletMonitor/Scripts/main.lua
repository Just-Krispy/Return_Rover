local MOD_NAME = "WalletMonitor"
local SETTINGS_PATH = "ue4ss/Mods/WalletMonitor/config/settings.json"

local settings = {
    enabled = true,
    scanIntervalMs = 500,
    logEveryTicks = 10,
    enableActionHooks = true,
    trackAllWalletEntries = false,
    logAllRuntimeEntriesOnce = true,
    maxHookRegisterAttempts = 600,
    maxLoggedChangesPerTick = 32,
    debug = false,
}

local tickCount = 0
local baselineLogged = false
local waitingLogged = false
local lastSnapshot = nil
local runtimeEntriesLogged = false
local actionHookRegisteredCount = 0
local actionHookRegistered = {}
local actionHookAttempts = {}

local persistentHints = {
    playerProgress = "playerProgress",
    runtimeInventory = "runtimeInventory_225_2397F74E446B3491AB63C28E8D13ACEC",
    runtimeEntryName = "name_2_76A6ED884C1808D1663DD8B1AC4A7534",
    runtimeEntryAmount = "amount_5_BCEA82214D7F817FDA90DF805AF0C332",
}

local resolvedRuntimeInventoryField = nil
local resolvedRuntimeNameField = nil
local resolvedRuntimeAmountField = nil

local actionHooks = {
    {
        label = "WanderingTrader.F_Interact",
        path = "/Game/Characters/BP_NPC_WanderingTrader.BP_NPC_WanderingTrader_C:F_Interact",
    },
    {
        label = "JokerCard.F_BuyJoker",
        path = "/Game/Interfaces/Tweaks/UI_JokerCard.UI_JokerCard_C:F_BuyJoker",
    },
    {
        label = "JokerCard.F_SelectItem",
        path = "/Game/Interfaces/Tweaks/UI_JokerCard.UI_JokerCard_C:F_SelectItem",
    },
    {
        label = "JokerShop.UniqueClick",
        path = "/Game/Interfaces/Tweaks/UI_JokerShop.UI_JokerShop_C:BndEvt__UI_JokerShop_UI_Template_Button_Unique_K2Node_ComponentBoundEvent_7_disp_Click__DelegateSignature",
    },
    {
        label = "RandomJoker.F_SelectTweak",
        path = "/Game/Interfaces/Tweaks/UI_RandomJoker.UI_RandomJoker_C:F_SelectTweak",
    },
    {
        label = "SkinShop.Skins.Buy",
        path = "/Game/Interfaces/Skins/UI_Skins.UI_Skins_C:BndEvt__UI_Equipment_Progress_Skins_UI_Template_Button_Buy_K2Node_ComponentBoundEvent_3_disp_Click__DelegateSignature",
    },
    {
        label = "SkinShop.Mounts.Buy",
        path = "/Game/Interfaces/Skins/UI_Mounts.UI_Mounts_C:BndEvt__UI_Equipment_Progress_Skins_UI_Template_Button_Buy_K2Node_ComponentBoundEvent_3_disp_Click__DelegateSignature",
    },
    {
        label = "SkinShop.Titles.Buy",
        path = "/Game/Interfaces/Skins/UI_Titles.UI_Titles_C:BndEvt__UI_Equipment_Progress_Skins_UI_Template_Button_Buy_K2Node_ComponentBoundEvent_3_disp_Click__DelegateSignature",
    },
    {
        label = "SkinShop.Emotes.Buy",
        path = "/Game/Interfaces/Skins/UI_Emotes.UI_Emotes_C:BndEvt__UI_Equipment_Progress_Emotes_UI_Template_Button_Buy_K2Node_ComponentBoundEvent_0_disp_Click__DelegateSignature",
    },
}

local function Log(message)
    print(string.format("[%s] %s\n", MOD_NAME, tostring(message)))
end

local function lower(value)
    return string.lower(tostring(value or ""))
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
    settings.enableActionHooks = boolValue("enableActionHooks", settings.enableActionHooks)
    settings.trackAllWalletEntries = boolValue("trackAllWalletEntries", settings.trackAllWalletEntries)
    settings.logAllRuntimeEntriesOnce = boolValue("logAllRuntimeEntriesOnce", settings.logAllRuntimeEntriesOnce)
    settings.debug = boolValue("debug", settings.debug)
    settings.scanIntervalMs = numberValue("scanIntervalMs", settings.scanIntervalMs)
    settings.logEveryTicks = numberValue("logEveryTicks", settings.logEveryTicks)
    settings.maxHookRegisterAttempts = numberValue("maxHookRegisterAttempts", settings.maxHookRegisterAttempts)
    settings.maxLoggedChangesPerTick = numberValue("maxLoggedChangesPerTick", settings.maxLoggedChangesPerTick)

    if settings.scanIntervalMs < 100 then
        settings.scanIntervalMs = 100
    end
    if settings.logEveryTicks < 1 then
        settings.logEveryTicks = 1
    end
    if settings.maxHookRegisterAttempts < 1 then
        settings.maxHookRegisterAttempts = 1
    end
    if settings.maxLoggedChangesPerTick < 1 then
        settings.maxLoggedChangesPerTick = 1
    end
end

local function isValidObject(object)
    local ok, valid = pcall(function()
        return object and object:IsValid()
    end)
    return ok and valid
end

local function readableValue(value)
    if value == nil then
        return ""
    end

    local valueType = type(value)
    if valueType == "string" or valueType == "number" or valueType == "boolean" then
        return tostring(value)
    end

    local toStringOk, text = pcall(function()
        return value:ToString()
    end)
    if toStringOk and text then
        return tostring(text)
    end

    local fullNameOk, fullName = pcall(function()
        return value:GetFullName()
    end)
    if fullNameOk and fullName then
        return tostring(fullName)
    end

    return tostring(value)
end

local function propertyName(property)
    local fNameOk, fName = pcall(function()
        return property:GetFName():ToString()
    end)
    if fNameOk and fName then
        return tostring(fName)
    end

    local nameOk, name = pcall(function()
        return property:GetName()
    end)
    if nameOk and name then
        return tostring(name)
    end

    return nil
end

local function isPropertyA(property, propertyTypeName)
    local propertyType = PropertyTypes and PropertyTypes[propertyTypeName]
    if propertyType then
        local ok, result = pcall(function()
            return property:IsA(propertyType)
        end)
        if ok then
            return result
        end
    end

    local classNameOk, className = pcall(function()
        return property:GetClass():GetFName():ToString()
    end)
    if not classNameOk or not className then
        return false
    end

    return string.find(lower(className), lower(propertyTypeName), 1, true) ~= nil
end

local function findFirstValid(className)
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

local function findRuntimeInventoryEntryFields(runtimeInventoryStruct)
    local selectedNameField = nil
    local selectedAmountField = nil
    local fallbackNameField = nil
    local fallbackAmountField = nil
    local fallbackAny = nil

    local ok = pcall(function()
        runtimeInventoryStruct:ForEachProperty(function(property)
            local name = propertyName(property)
            if not name then
                return false
            end

            local lowered = lower(name)
            if not fallbackAny then
                fallbackAny = name
            end

            if string.find(lowered, "name", 1, true) then
                selectedNameField = selectedNameField or name
            elseif not fallbackNameField then
                local classNameOk, className = pcall(function()
                    return property:GetClass():GetFName():ToString()
                end)
                if classNameOk and className and string.find(lower(className), "nameproperty", 1, true) then
                    fallbackNameField = name
                end
            end

            if string.find(lowered, "amount", 1, true) then
                selectedAmountField = selectedAmountField or name
            elseif not fallbackAmountField then
                local classNameOk, className = pcall(function()
                    return property:GetClass():GetFName():ToString()
                end)
                if classNameOk and className and string.find(lower(className), "intproperty", 1, true) then
                    fallbackAmountField = name
                end
            end

            return false
        end)
    end)

    if not ok then
        return nil, nil
    end

    local nameField = selectedNameField or fallbackNameField or fallbackAny
    local amountField = selectedAmountField or fallbackAmountField
    if not amountField and nameField == fallbackAny then
        local secondField = nil
        pcall(function()
            runtimeInventoryStruct:ForEachProperty(function(property)
                local name = propertyName(property)
                if name and name ~= nameField then
                    secondField = name
                    return true
                end
                return false
            end)
        end)
        amountField = secondField
    end

    return nameField, amountField
end

local function resolveRuntimeInventoryFieldName()
    if resolvedRuntimeInventoryField then
        return resolvedRuntimeInventoryField
    end

    local structOk, playerProgressStruct = pcall(function()
        return StaticFindObject("UserDefinedStruct /Game/Player/SaveGames/S_PlayerProgress.S_PlayerProgress")
    end)
    if structOk and isValidObject(playerProgressStruct) then
        pcall(function()
            playerProgressStruct:ForEachProperty(function(property)
                local name = propertyName(property)
                if name and string.find(lower(name), "runtimeinventory", 1, true) then
                    resolvedRuntimeInventoryField = name
                    return true
                end
                return false
            end)
        end)
    end

    if not resolvedRuntimeInventoryField then
        resolvedRuntimeInventoryField = persistentHints.runtimeInventory
    end

    return resolvedRuntimeInventoryField
end

local function resolveRuntimeEntryFields()
    if resolvedRuntimeNameField and resolvedRuntimeAmountField then
        return resolvedRuntimeNameField, resolvedRuntimeAmountField
    end

    local structOk, runtimeStruct = pcall(function()
        return StaticFindObject("UserDefinedStruct /Game/Player/SaveGames/S_RuntimeInventory.S_RuntimeInventory")
    end)
    if structOk and isValidObject(runtimeStruct) then
        local nameField, amountField = findRuntimeInventoryEntryFields(runtimeStruct)
        resolvedRuntimeNameField = nameField or resolvedRuntimeNameField
        resolvedRuntimeAmountField = amountField or resolvedRuntimeAmountField
    end

    if not resolvedRuntimeNameField then
        resolvedRuntimeNameField = persistentHints.runtimeEntryName
    end
    if not resolvedRuntimeAmountField then
        resolvedRuntimeAmountField = persistentHints.runtimeEntryAmount
    end

    return resolvedRuntimeNameField, resolvedRuntimeAmountField
end

local function getStandaloneSaveProgressValue()
    local saveInstance = findFirstValid("SG_PlayerProgress_C")
    if isValidObject(saveInstance) then
        local saveProgressOk, saveProgressValue = pcall(function()
            return saveInstance[persistentHints.playerProgress]
        end)
        if saveProgressOk and saveProgressValue then
            return saveProgressValue
        end
    end

    return nil
end

local function getPlayerProgressValue(gameInstance, preferSaveObject)
    local function readDirect()
        if not isValidObject(gameInstance) then
            return nil
        end

        local directOk, directValue = pcall(function()
            return gameInstance[persistentHints.playerProgress]
        end)
        if directOk and directValue then
            return directValue
        end

        return nil
    end

    local function readSaveObject()
        if not isValidObject(gameInstance) then
            return nil
        end

        local saveOk, saveObject = pcall(function()
            return gameInstance.SG_PlayerProgress
        end)
        if saveOk and isValidObject(saveObject) then
            local saveProgressOk, saveProgressValue = pcall(function()
                return saveObject[persistentHints.playerProgress]
            end)
            if saveProgressOk and saveProgressValue then
                return saveProgressValue
            end
        end

        return nil
    end

    local standaloneSave = getStandaloneSaveProgressValue()

    if preferSaveObject then
        return readSaveObject() or standaloneSave or readDirect()
    end

    return readDirect() or readSaveObject() or standaloneSave
end

local function shouldTrackCurrency(entryName)
    local name = lower(entryName)
    if name == "" then
        return false
    end

    return string.find(name, "gold", 1, true)
        or string.find(name, "xp", 1, true)
        or string.find(name, "ticket", 1, true)
        or string.find(name, "soul", 1, true)
end

local function normalizeWalletKey(entryName)
    local key = lower(entryName)
    key = string.gsub(key, "%s+", "")
    return key
end

local formatRuntimeEntries

local function collectWalletSnapshot()
    local gameInstance = findFirstValid("BP_CanyonGameInstance_C")

    local playerProgressValue = getPlayerProgressValue(gameInstance, true)
    if not playerProgressValue then
        return nil, "playerProgress value unavailable (game/save not ready)"
    end

    local runtimeInventoryField = resolveRuntimeInventoryFieldName()

    local runtimeArrayOk, runtimeArray = pcall(function()
        return playerProgressValue[runtimeInventoryField]
    end)
    if (not runtimeArrayOk or not runtimeArray) and runtimeInventoryField ~= persistentHints.runtimeInventory then
        runtimeInventoryField = persistentHints.runtimeInventory
        runtimeArrayOk, runtimeArray = pcall(function()
            return playerProgressValue[runtimeInventoryField]
        end)
    end
    if not runtimeArrayOk or not runtimeArray then
        return nil, "runtimeInventory value unavailable"
    end

    local nameField, amountField = resolveRuntimeEntryFields()
    if not nameField or not amountField then
        return nil, "runtimeInventory entry fields missing"
    end

    local snapshot = {}
    local allEntries = {}
    local found = 0

    pcall(function()
        runtimeArray:ForEach(function(_, element)
            local entry = element

            local unwrapOk, unwrapped = pcall(function()
                return element:get()
            end)
            if unwrapOk and unwrapped then
                entry = unwrapped
            end

            if not entry then
                return nil
            end

            local resolvedNameField = nameField
            local resolvedAmountField = amountField

            local nameOk, entryNameValue = pcall(function()
                return entry[resolvedNameField]
            end)
            if (not nameOk or entryNameValue == nil) and resolvedNameField ~= persistentHints.runtimeEntryName then
                resolvedNameField = persistentHints.runtimeEntryName
                nameOk, entryNameValue = pcall(function()
                    return entry[resolvedNameField]
                end)
            end
            if not nameOk or entryNameValue == nil then
                return nil
            end

            local entryName = readableValue(entryNameValue)

            local amountOk, entryAmount = pcall(function()
                return tonumber(entry[resolvedAmountField])
            end)
            if (not amountOk or type(entryAmount) ~= "number") and resolvedAmountField ~= persistentHints.runtimeEntryAmount then
                resolvedAmountField = persistentHints.runtimeEntryAmount
                amountOk, entryAmount = pcall(function()
                    return tonumber(entry[resolvedAmountField])
                end)
            end
            if not amountOk or type(entryAmount) ~= "number" then
                return nil
            end

            local key = normalizeWalletKey(entryName)
            if key ~= "" then
                allEntries[key] = {
                    name = entryName,
                    amount = entryAmount,
                }

                if settings.trackAllWalletEntries or shouldTrackCurrency(entryName) then
                    snapshot[key] = entryAmount
                    found = found + 1
                end
            end

            return nil
        end)
    end)

    if settings.logAllRuntimeEntriesOnce and (not runtimeEntriesLogged) then
        runtimeEntriesLogged = true
        Log("Runtime inventory entries: " .. formatRuntimeEntries(allEntries))
    end

    if found == 0 then
        return nil, "no tracked wallet entries found"
    end

    return snapshot, nil
end

local function cloneSnapshot(snapshot)
    if not snapshot then
        return nil
    end

    local copy = {}
    for key, value in pairs(snapshot) do
        copy[key] = value
    end
    return copy
end

local function sortedKeys(snapshot)
    local keys = {}
    for key, _ in pairs(snapshot) do
        table.insert(keys, key)
    end
    table.sort(keys)
    return keys
end

local function formatSnapshot(snapshot)
    if not snapshot then
        return "<nil>"
    end

    local parts = {}
    for _, key in ipairs(sortedKeys(snapshot)) do
        table.insert(parts, key .. "=" .. tostring(snapshot[key]))
    end

    if #parts == 0 then
        return "<empty>"
    end

    return table.concat(parts, ", ")
end

formatRuntimeEntries = function(entries)
    if not entries then
        return "<nil>"
    end

    local keys = sortedKeys(entries)
    if #keys == 0 then
        return "<empty>"
    end

    local parts = {}
    for _, key in ipairs(keys) do
        local entry = entries[key]
        local displayName = entry and entry.name or key
        local amount = entry and entry.amount or "?"
        table.insert(parts, string.format("%s[%s]=%s", key, tostring(displayName), tostring(amount)))
    end

    return table.concat(parts, ", ")
end

local function buildChangeList(oldSnapshot, newSnapshot)
    local keySet = {}
    local changes = {}

    for key, _ in pairs(oldSnapshot or {}) do
        keySet[key] = true
    end
    for key, _ in pairs(newSnapshot or {}) do
        keySet[key] = true
    end

    local keys = {}
    for key, _ in pairs(keySet) do
        table.insert(keys, key)
    end
    table.sort(keys)

    for _, key in ipairs(keys) do
        local oldValue = oldSnapshot and oldSnapshot[key] or nil
        local newValue = newSnapshot and newSnapshot[key] or nil

        if oldValue ~= newValue then
            local deltaText = "n/a"
            if type(oldValue) == "number" and type(newValue) == "number" then
                deltaText = string.format("%+d", newValue - oldValue)
            elseif oldValue == nil and type(newValue) == "number" then
                deltaText = string.format("%+d", newValue)
            elseif type(oldValue) == "number" and newValue == nil then
                deltaText = string.format("%+d", -oldValue)
            end

            table.insert(changes, string.format(
                "Wallet change: %s %s -> %s (delta=%s)",
                key,
                tostring(oldValue),
                tostring(newValue),
                deltaText
            ))
        end
    end

    return changes
end

local function logActionSnapshot(label, phase)
    local snapshot, err = collectWalletSnapshot()
    if snapshot then
        Log(string.format("Action hook %s: %s snapshot=%s", phase, label, formatSnapshot(snapshot)))
    elseif settings.debug then
        Log(string.format("Action hook %s: %s snapshot unavailable: %s", phase, label, tostring(err)))
    end
end

local function registerActionHooks()
    if not settings.enableActionHooks or actionHookRegisteredCount >= #actionHooks then
        return
    end

    for _, hook in ipairs(actionHooks) do
        local hookPath = hook.path
        local hookLabel = hook.label
        if not actionHookRegistered[hookPath] then
            actionHookAttempts[hookPath] = (actionHookAttempts[hookPath] or 0) + 1
            if actionHookAttempts[hookPath] <= settings.maxHookRegisterAttempts then
                local ok = pcall(function()
                    RegisterHook(hookPath, function()
                        logActionSnapshot(hookLabel, "fired")
                        pcall(function()
                            ExecuteWithDelay(250, function()
                                logActionSnapshot(hookLabel, "settled")
                            end)
                        end)
                    end)
                end)

                if ok then
                    actionHookRegistered[hookPath] = true
                    actionHookRegisteredCount = actionHookRegisteredCount + 1
                    Log(string.format("Registered action hook: %s", hookLabel))
                end
            end
        end
    end
end

loadSettings()
Log(string.format(
    "Loaded. scanIntervalMs=%s logEveryTicks=%s actionHooks=%s debug=%s.",
    tostring(settings.scanIntervalMs),
    tostring(settings.logEveryTicks),
    tostring(settings.enableActionHooks),
    tostring(settings.debug)
))

LoopAsync(settings.scanIntervalMs, function()
    if not settings.enabled then
        return false
    end

    tickCount = tickCount + 1
    registerActionHooks()

    local snapshot, err = collectWalletSnapshot()
    if not snapshot then
        if settings.debug and ((not waitingLogged) or tickCount % settings.logEveryTicks == 0) then
            waitingLogged = true
            Log("Waiting for wallet snapshot: " .. tostring(err))
        end
        return false
    end

    waitingLogged = false

    if not baselineLogged then
        baselineLogged = true
        lastSnapshot = cloneSnapshot(snapshot)
        Log("Baseline wallets: " .. formatSnapshot(snapshot))
        return false
    end

    local changes = buildChangeList(lastSnapshot, snapshot)
    if #changes > 0 then
        local logged = 0
        for _, line in ipairs(changes) do
            if logged >= settings.maxLoggedChangesPerTick then
                break
            end
            Log(line)
            logged = logged + 1
        end

        if #changes > logged then
            Log(string.format("Wallet change entries truncated: %s omitted", tostring(#changes - logged)))
        end
    elseif settings.debug and tickCount % settings.logEveryTicks == 0 then
        Log("Snapshot: " .. formatSnapshot(snapshot))
    end

    lastSnapshot = cloneSnapshot(snapshot)
    return false
end)
