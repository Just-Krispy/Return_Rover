local MOD_NAME = "GoldSandbox"
local SETTINGS_PATH = "ue4ss/Mods/GoldSandbox/config/settings.json"

local settings = {
    enabled = true,
    targetGold = 999999,
    refillBelow = 999000,
    enablePersistentGold = true,
    targetPersistentGold = 999999,
    enablePersistentSoul = true,
    targetPersistentSoul = 999999,
    refillBelowSoul = 999000,
    enablePersistentTickets = true,
    ticketWalletKey = "itemHero",
    targetPersistentTickets = 99999,
    refillBelowTickets = 99999,
    enablePersistentXpFields = true,
    targetPersistentXpFields = 999999,
    refillBelowXpFields = 999000,
    persistentScanEveryTicks = 2,
    scanIntervalMs = 1000,
    enableActionHooks = true,
    maxHookRegisterAttempts = 600,
    debug = false,
}

local tickCount = 0
local hasLoggedTarget = false
local hasLoggedWaiting = false
local lastRefillSourceGold = nil
local lastPersistentRefillSourceByKey = {}
local lastPersistentRefillSourceByField = {}
local loggedMissingXpFields = {}
local loggedSeenXpFields = {}
local hasLoggedXpFieldCandidates = false
local actionHookRegisteredCount = 0
local actionHookRegistered = {}
local actionHookAttempts = {}

local xpFieldCandidates = {
    "totalXp",
    "totalXP",
    "totalxp",
    "heroXp",
    "heroXP",
    "heroxp",
    "itemXp",
    "itemXP",
    "itemxp",
    "currentXp",
    "currentXP",
    "currentxp",
    "xpTickets",
    "XPTickets",
    "xptickets",
    "ticketXp",
    "ticketXP",
    "ticketxp",
    "spellxp",
    "weaponxp",
    "weapxp",
}

local resolvedXpFieldCandidates = nil

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
    {
        label = "SkinShop.Skins.F_ClickSkinButton",
        path = "/Game/Interfaces/Skins/UI_Skins.UI_Skins_C:F_ClickSkinButton",
    },
    {
        label = "SkinShop.Skins.F_UpdateUnlocked",
        path = "/Game/Interfaces/Skins/UI_Skins.UI_Skins_C:F_UpdateUnlocked",
    },
}

local function Log(message)
    print(string.format("[%s] %s\n", MOD_NAME, tostring(message)))
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

    local function stringValue(key, current)
        local value = string.match(content, '"' .. key .. '"%s*:%s*"([^"]+)"')
        return value or current
    end

    settings.enabled = boolValue("enabled", settings.enabled)
    settings.debug = boolValue("debug", settings.debug)
    settings.enableActionHooks = boolValue("enableActionHooks", settings.enableActionHooks)
    settings.enablePersistentGold = boolValue("enablePersistentGold", settings.enablePersistentGold)
    settings.enablePersistentSoul = boolValue("enablePersistentSoul", settings.enablePersistentSoul)
    settings.enablePersistentTickets = boolValue("enablePersistentTickets", settings.enablePersistentTickets)
    settings.enablePersistentXpFields = boolValue("enablePersistentXpFields", settings.enablePersistentXpFields)
    settings.targetGold = numberValue("targetGold", settings.targetGold)
    settings.refillBelow = numberValue("refillBelow", settings.refillBelow)
    settings.targetPersistentGold = numberValue("targetPersistentGold", settings.targetPersistentGold)
    settings.targetPersistentSoul = numberValue("targetPersistentSoul", settings.targetPersistentSoul)
    settings.refillBelowSoul = numberValue("refillBelowSoul", settings.refillBelowSoul)
    settings.targetPersistentTickets = numberValue("targetPersistentTickets", settings.targetPersistentTickets)
    settings.refillBelowTickets = numberValue("refillBelowTickets", settings.refillBelowTickets)
    settings.targetPersistentXpFields = numberValue("targetPersistentXpFields", settings.targetPersistentXpFields)
    settings.refillBelowXpFields = numberValue("refillBelowXpFields", settings.refillBelowXpFields)
    settings.ticketWalletKey = stringValue("ticketWalletKey", settings.ticketWalletKey)
    settings.persistentScanEveryTicks = numberValue("persistentScanEveryTicks", settings.persistentScanEveryTicks)
    settings.scanIntervalMs = numberValue("scanIntervalMs", settings.scanIntervalMs)
    settings.maxHookRegisterAttempts = numberValue("maxHookRegisterAttempts", settings.maxHookRegisterAttempts)

    if settings.refillBelow > settings.targetGold then
        settings.refillBelow = settings.targetGold
    end

    if settings.refillBelowSoul > settings.targetPersistentSoul then
        settings.refillBelowSoul = settings.targetPersistentSoul
    end

    if settings.refillBelowTickets > settings.targetPersistentTickets then
        settings.refillBelowTickets = settings.targetPersistentTickets
    end

    if settings.refillBelowXpFields > settings.targetPersistentXpFields then
        settings.refillBelowXpFields = settings.targetPersistentXpFields
    end

    if settings.ticketWalletKey == "" then
        settings.ticketWalletKey = "itemHero"
    end

    if settings.persistentScanEveryTicks < 1 then
        settings.persistentScanEveryTicks = 1
    end
end

local function isValidObject(object)
    local ok, valid = pcall(function()
        return object and object:IsValid()
    end)
    return ok and valid
end

local function lower(value)
    return string.lower(tostring(value or ""))
end

local function normalizeWalletKey(value)
    local key = lower(value)
    key = string.gsub(key, "%s+", "")
    return key
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

    -- Fallback when PropertyTypes is unavailable in this runtime.
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

local function findPlayerProgressClassProperty(gameInstanceClass)
    local selected = nil
    local selectedScore = -1

    local ok = pcall(function()
        gameInstanceClass:ForEachProperty(function(property)
            local structOk, structObject = pcall(function()
                return property:GetStruct()
            end)
            if not structOk or not isValidObject(structObject) then
                return false
            end

            local name = propertyName(property)
            if not name then
                return false
            end

            local lowered = lower(name)
            local score = 0
            if string.find(lowered, "playerprogress", 1, true) then
                score = score + 6
            elseif string.find(lowered, "progress", 1, true) then
                score = score + 3
            end
            if string.find(lowered, "player", 1, true) then
                score = score + 1
            end

            local fullName = ""
            local fullNameOk, structFullName = pcall(function()
                return structObject:GetFullName()
            end)
            if fullNameOk and structFullName then
                fullName = lower(structFullName)
            end

            if string.find(fullName, "s_playerprogress", 1, true) then
                score = score + 8
            elseif string.find(fullName, "playerprogress", 1, true) then
                score = score + 4
            end

            if score > selectedScore then
                selected = { name = name, property = property }
                selectedScore = score
            end

            return false
        end)
    end)

    if not ok then
        return nil
    end

    return selected
end

local function findRuntimeInventoryProperty(playerProgressStruct)
    local selected = nil
    local fallback = nil

    local ok = pcall(function()
        playerProgressStruct:ForEachProperty(function(property)
            local innerOk, inner = pcall(function()
                return property:GetInner()
            end)
            if not innerOk or not inner then
                return false
            end

            local innerStructOk, innerStruct = pcall(function()
                return inner:GetStruct()
            end)
            if not innerStructOk or not isValidObject(innerStruct) then
                return false
            end

            local name = propertyName(property)
            if not name then
                return false
            end

            local info = {
                name = name,
                property = property,
                innerProperty = inner,
                innerStruct = innerStruct,
            }

            if string.find(lower(name), "runtimeinventory", 1, true) then
                selected = info
                return true
            end

            if not fallback then
                fallback = info
            end

            return false
        end)
    end)

    if not ok then
        return nil
    end

    return selected or fallback
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

local function tryInvokeSaveMethods(gameInstance)
    local invoked = {}

    local function tryInvoke(methodName)
        local methodOk, method = pcall(function()
            return gameInstance[methodName]
        end)
        if not methodOk or type(method) ~= "function" then
            return
        end

        local callOk = pcall(function()
            method(gameInstance)
        end)
        if callOk then
            table.insert(invoked, methodName)
        end
    end

    tryInvoke("F_SavePlayerProgress")
    tryInvoke("F_AutoSavePlayerProgress")
    tryInvoke("F_SaveGame")
    tryInvoke("F_ForceSaveSmallDelay")

    return invoked
end

local persistentHints = {
    playerProgress = "playerProgress",
    runtimeInventory = "runtimeInventory_225_2397F74E446B3491AB63C28E8D13ACEC",
    runtimeEntryName = "name_2_76A6ED884C1808D1663DD8B1AC4A7534",
    runtimeEntryAmount = "amount_5_BCEA82214D7F817FDA90DF805AF0C332",
}

local function resolveXpFieldCandidates()
    if resolvedXpFieldCandidates then
        return resolvedXpFieldCandidates
    end

    local unique = {}
    for _, name in ipairs(xpFieldCandidates) do
        unique[name] = true
    end

    local structOk, playerProgressStruct = pcall(function()
        return StaticFindObject("UserDefinedStruct /Game/Player/SaveGames/S_PlayerProgress.S_PlayerProgress")
    end)
    if structOk and isValidObject(playerProgressStruct) then
        pcall(function()
            playerProgressStruct:ForEachProperty(function(property)
                local name = propertyName(property)
                if not name then
                    return false
                end

                local lowered = lower(name)
                local looksLikeXp = string.find(lowered, "xp", 1, true)
                    or string.find(lowered, "ticket", 1, true)
                    or string.find(lowered, "hero", 1, true)
                if not looksLikeXp then
                    return false
                end

                if isPropertyA(property, "IntProperty") or isPropertyA(property, "FloatProperty") then
                    unique[name] = true
                end

                return false
            end)
        end)
    end

    resolvedXpFieldCandidates = {}
    for name, _ in pairs(unique) do
        table.insert(resolvedXpFieldCandidates, name)
    end
    table.sort(resolvedXpFieldCandidates)

    return resolvedXpFieldCandidates
end

local resolvedRuntimeInventoryField = nil
local resolvedRuntimeNameField = nil
local resolvedRuntimeAmountField = nil

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

local function getPlayerProgressValue(gameInstance, preferSaveObject)
    local function readDirect()
        local directOk, directValue = pcall(function()
            return gameInstance[persistentHints.playerProgress]
        end)
        if directOk and directValue then
            return directValue
        end
        return nil
    end

    local function readSave()
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

    if preferSaveObject then
        return readSave() or readDirect()
    end

    return readDirect() or readSave()
end

local function setPersistentMenuWalletEntry(walletKey, targetAmount, refillBelowAmount)
    local normalizedTargetKey = normalizeWalletKey(walletKey)
    if normalizedTargetKey == "" then
        return false, "wallet key is empty"
    end

    local targetValue = tonumber(targetAmount)
    if type(targetValue) ~= "number" then
        return false, "target amount is invalid"
    end

    local refillFloor = tonumber(refillBelowAmount) or targetValue
    if refillFloor > targetValue then
        refillFloor = targetValue
    end

    local gameInstance = findFirstValid("BP_CanyonGameInstance_C")
    if not gameInstance then
        return false, "BP_CanyonGameInstance_C not found"
    end

    local function applyToPlayerProgress(playerProgressValue)
        if not playerProgressValue then
            return false, false, nil, nil, nil
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
            return false, false, nil, nil, nil
        end

        local nameField, amountField = resolveRuntimeEntryFields()
        if not nameField or not amountField then
            return false, false, nil, nil, nil
        end

        local foundEntry = false
        local changed = false
        local oldValue = nil
        local lastSeenValue = nil
        local entryIndex = nil

        pcall(function()
            runtimeArray:ForEach(function(index, element)
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

                local entryKey = normalizeWalletKey(readableValue(entryNameValue))
                local keyMatches = entryKey == normalizedTargetKey
                    or string.find(entryKey, normalizedTargetKey, 1, true) ~= nil
                if not keyMatches then
                    return nil
                end

                local amountOk, currentAmount = pcall(function()
                    return tonumber(entry[resolvedAmountField])
                end)
                if (not amountOk or type(currentAmount) ~= "number") and resolvedAmountField ~= persistentHints.runtimeEntryAmount then
                    resolvedAmountField = persistentHints.runtimeEntryAmount
                    amountOk, currentAmount = pcall(function()
                        return tonumber(entry[resolvedAmountField])
                    end)
                end
                if not amountOk or type(currentAmount) ~= "number" then
                    return nil
                end

                foundEntry = true
                oldValue = currentAmount
                lastSeenValue = currentAmount
                entryIndex = tonumber(index) and (tonumber(index) - 1) or nil

                if currentAmount < refillFloor then
                    local setOk = pcall(function()
                        entry[resolvedAmountField] = targetValue
                    end)
                    if setOk then
                        changed = true
                        lastSeenValue = targetValue
                    end
                end

                return true
            end)
        end)

        return foundEntry, changed, oldValue, lastSeenValue, entryIndex
    end

    local preferSaveObject = normalizedTargetKey ~= normalizeWalletKey("moneyGold")
    local primaryProgressValue = getPlayerProgressValue(gameInstance, preferSaveObject)
    local secondaryProgressValue = getPlayerProgressValue(gameInstance, not preferSaveObject)

    local primaryFound, primaryChanged, primaryOldValue, primaryLastSeenValue, primaryEntryIndex = applyToPlayerProgress(primaryProgressValue)

    local secondaryFound = false
    local secondaryChanged = false
    local secondaryOldValue = nil
    local secondaryLastSeenValue = nil
    local secondaryEntryIndex = nil

    if secondaryProgressValue and secondaryProgressValue ~= primaryProgressValue then
        secondaryFound, secondaryChanged, secondaryOldValue, secondaryLastSeenValue, secondaryEntryIndex = applyToPlayerProgress(secondaryProgressValue)
    end

    local foundEntry = primaryFound or secondaryFound
    local changed = primaryChanged or secondaryChanged
    local oldValue = primaryOldValue or secondaryOldValue
    local lastSeenValue = primaryLastSeenValue or secondaryLastSeenValue
    local entryIndex = primaryEntryIndex or secondaryEntryIndex

    if not foundEntry then
        return false, tostring(walletKey) .. " entry not found"
    end

    if changed then
        local invoked = tryInvokeSaveMethods(gameInstance)
        local indexText = entryIndex and tostring(entryIndex) or "?"
        local saveText = #invoked > 0 and table.concat(invoked, ",") or "none"
        return true, string.format("%s[%s] %s -> %s (save=%s)", tostring(walletKey), indexText, tostring(oldValue), tostring(targetValue), saveText), oldValue
    end

    return true, string.format("%s already %s", tostring(walletKey), tostring(lastSeenValue)), nil
end

local function syncPersistentWallet(reason, logNoChange, enabled, walletKey, targetAmount, refillBelowAmount, label)
    if not enabled then
        return
    end

    local callOk, persistentOk, persistentMessage, sourceAmount = pcall(function()
        return setPersistentMenuWalletEntry(walletKey, targetAmount, refillBelowAmount)
    end)

    local walletLabel = tostring(label or walletKey)

    if not callOk then
        if settings.debug then
            Log("Persistent " .. walletLabel .. " error (" .. tostring(reason) .. "): " .. tostring(persistentOk))
        end
        return
    end

    if persistentOk then
        if string.find(tostring(persistentMessage), "->", 1, true) then
            local sourceKey = normalizeWalletKey(walletKey)
            if settings.debug or lastPersistentRefillSourceByKey[sourceKey] ~= sourceAmount then
                Log("Persistent " .. walletLabel .. " updated (" .. tostring(reason) .. "): " .. tostring(persistentMessage))
            end
            lastPersistentRefillSourceByKey[sourceKey] = sourceAmount
        elseif logNoChange and settings.debug then
            Log("Persistent " .. walletLabel .. " check (" .. tostring(reason) .. "): " .. tostring(persistentMessage))
        end
    elseif settings.debug then
        Log("Persistent " .. walletLabel .. " pending (" .. tostring(reason) .. "): " .. tostring(persistentMessage))
    end
end

local function setPersistentNumericField(fieldName, targetAmount, refillBelowAmount)
    local targetFieldName = tostring(fieldName or "")
    if targetFieldName == "" then
        return false, "field name is empty"
    end

    local targetValue = tonumber(targetAmount)
    if type(targetValue) ~= "number" then
        return false, "target amount is invalid"
    end

    local refillFloor = tonumber(refillBelowAmount) or targetValue
    if refillFloor > targetValue then
        refillFloor = targetValue
    end

    local gameInstance = findFirstValid("BP_CanyonGameInstance_C") or findFirstValid("BP_GameInstance_C")

    local sources = {}

    if gameInstance then
        table.insert(sources, { label = "gameInstance", value = gameInstance })

        local primaryProgressValue = getPlayerProgressValue(gameInstance, true)
        local secondaryProgressValue = getPlayerProgressValue(gameInstance, false)

        if primaryProgressValue then
            table.insert(sources, { label = "playerProgress(runtime)", value = primaryProgressValue })
        end
        if secondaryProgressValue and secondaryProgressValue ~= primaryProgressValue then
            table.insert(sources, { label = "playerProgress(save)", value = secondaryProgressValue })
        end

        local saveGameOk, saveGame = pcall(function()
            return gameInstance.currentSaveGame
        end)
        if saveGameOk and saveGame then
            table.insert(sources, { label = "currentSaveGame", value = saveGame })
        end
    end

    local extraSourceClasses = {
        "BP_PlayerState_C",
        "BP_CanyonPlayerState_C",
        "BP_PlayerController_C",
        "BP_CanyonPlayerController_C",
        "BP_GameState_C",
    }

    for _, className in ipairs(extraSourceClasses) do
        local sourceObject = findFirstValid(className)
        if sourceObject then
            table.insert(sources, { label = className, value = sourceObject })
        end
    end

    if #sources == 0 then
        return false, "persistent source objects not found"
    end

    local function applyToSource(source)
        if not source or not source.value then
            return false, false, nil, nil
        end

        local amountOk, currentAmount = pcall(function()
            return tonumber(source.value[targetFieldName])
        end)
        if not amountOk or type(currentAmount) ~= "number" then
            return false, false, nil, nil
        end

        local changed = false
        local oldValue = currentAmount
        local lastValue = currentAmount

        if currentAmount < refillFloor then
            local setOk = pcall(function()
                source.value[targetFieldName] = targetValue
            end)
            if setOk then
                changed = true
                lastValue = targetValue
            end
        end

        return true, changed, oldValue, lastValue, tostring(source.label)
    end

    local foundField = false
    local changed = false
    local unchangedDetails = {}
    local changedDetails = {}
    local sourceFingerprintParts = {}

    for _, source in ipairs(sources) do
        local sourceFound, sourceChanged, oldValue, lastValue, sourceLabel = applyToSource(source)
        if sourceFound then
            foundField = true
            if sourceChanged then
                changed = true
                table.insert(changedDetails, string.format("%s %s -> %s", sourceLabel, tostring(oldValue), tostring(lastValue)))
                table.insert(sourceFingerprintParts, string.format("%s:%s", sourceLabel, tostring(oldValue)))
            else
                table.insert(unchangedDetails, string.format("%s=%s", sourceLabel, tostring(lastValue)))
            end
        end
    end

    if not foundField then
        return false, targetFieldName .. " field not found"
    end

    if changed then
        local saveText = "none"
        if gameInstance then
            local invoked = tryInvokeSaveMethods(gameInstance)
            if #invoked > 0 then
                saveText = table.concat(invoked, ",")
            end
        end
        local details = table.concat(changedDetails, "; ")
        local fingerprint = #sourceFingerprintParts > 0 and table.concat(sourceFingerprintParts, "|") or targetFieldName
        return true, string.format("%s %s (save=%s)", targetFieldName, details, saveText), fingerprint
    end

    local status = #unchangedDetails > 0 and table.concat(unchangedDetails, "; ") or "unchanged"
    return true, string.format("%s already %s", targetFieldName, status), nil
end

local function syncPersistentXpFields(reason, logNoChange)
    if not settings.enablePersistentXpFields then
        return
    end

    local candidates = resolveXpFieldCandidates()
    if (not hasLoggedXpFieldCandidates) and #candidates > 0 then
        Log("XP field candidates: " .. table.concat(candidates, ", "))
        hasLoggedXpFieldCandidates = true
    end

    for _, fieldName in ipairs(candidates) do
        local callOk, fieldOk, fieldMessage, sourceAmount = pcall(function()
            return setPersistentNumericField(fieldName, settings.targetPersistentXpFields, settings.refillBelowXpFields)
        end)

        if callOk and fieldOk then
            if string.find(tostring(fieldMessage), "->", 1, true) then
                if settings.debug or lastPersistentRefillSourceByField[fieldName] ~= sourceAmount then
                    Log("Persistent xpField updated (" .. tostring(reason) .. "): " .. tostring(fieldMessage))
                end
                lastPersistentRefillSourceByField[fieldName] = sourceAmount
            elseif logNoChange and settings.debug then
                Log("Persistent xpField check (" .. tostring(reason) .. "): " .. tostring(fieldMessage))
            elseif not loggedSeenXpFields[fieldName] then
                Log("Persistent xpField seen (" .. tostring(reason) .. "): " .. tostring(fieldMessage))
                loggedSeenXpFields[fieldName] = true
            end
        elseif callOk and (not fieldOk) then
            local missingKey = tostring(fieldName) .. "|" .. tostring(fieldMessage)
            if not loggedMissingXpFields[missingKey] then
                Log("Persistent xpField missing (" .. tostring(reason) .. "): " .. tostring(fieldMessage))
                loggedMissingXpFields[missingKey] = true
            end
        elseif not callOk and settings.debug then
            Log("Persistent xpField error (" .. tostring(reason) .. "): " .. tostring(fieldOk))
        end
    end
end

local function syncPersistentWallets(reason, logNoChange)
    syncPersistentWallet(
        reason,
        logNoChange,
        settings.enablePersistentGold,
        "moneyGold",
        settings.targetPersistentGold,
        settings.refillBelow,
        "gold"
    )

    syncPersistentWallet(
        reason,
        logNoChange,
        settings.enablePersistentSoul,
        "moneySoul",
        settings.targetPersistentSoul,
        settings.refillBelowSoul,
        "soul"
    )

    syncPersistentWallet(
        reason,
        logNoChange,
        settings.enablePersistentTickets,
        settings.ticketWalletKey,
        settings.targetPersistentTickets,
        settings.refillBelowTickets,
        "ticket"
    )

    syncPersistentXpFields(reason, logNoChange)
end

local function findGameStateGold()
    local ok, gameStates = pcall(function()
        return FindAllOf("BP_GameState_C")
    end)
    if not ok or not gameStates then
        return nil
    end

    for _, gameState in ipairs(gameStates) do
        if isValidObject(gameState) then
            local pickedOk, pickedUpGolds = pcall(function()
                return gameState.pickedUpGolds
            end)
            local usedOk, localUsedGolds = pcall(function()
                return gameState.localUsedGolds
            end)

            if pickedOk and usedOk and type(pickedUpGolds) == "number" and type(localUsedGolds) == "number" then
                return {
                    object = gameState,
                    pickedUpGolds = pickedUpGolds,
                    localUsedGolds = localUsedGolds,
                    currentGold = pickedUpGolds - localUsedGolds,
                }
            end
        end
    end

    return nil
end

local function setGold(goldState, targetGold)
    return pcall(function()
        local pickedUpGolds = goldState.pickedUpGolds
        if pickedUpGolds < targetGold then
            pickedUpGolds = targetGold
            goldState.object.pickedUpGolds = pickedUpGolds
        end

        local targetUsedGolds = pickedUpGolds - targetGold
        if targetUsedGolds < 0 then
            targetUsedGolds = 0
        end

        goldState.object.localUsedGolds = targetUsedGolds
        pcall(function()
            goldState.object:F_UpdateGolds()
        end)
    end)
end

local function formatGoldState()
    local goldState = findGameStateGold()
    if not goldState then
        return "goldState=<missing>"
    end

    return string.format(
        "currentGold=%s pickedUpGolds=%s localUsedGolds=%s",
        tostring(goldState.currentGold),
        tostring(goldState.pickedUpGolds),
        tostring(goldState.localUsedGolds)
    )
end

local function logActionHook(label)
    Log(string.format("Action hook fired: %s before=%s", label, formatGoldState()))

    syncPersistentWallets("hook:" .. tostring(label), false)

    local delayOk = pcall(function()
        ExecuteWithDelay(250, function()
            Log(string.format("Action hook settled: %s after250ms=%s", label, formatGoldState()))
        end)
    end)

    if not delayOk then
        Log(string.format("Action hook settled: %s afterDelayUnavailable=%s", label, formatGoldState()))
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
                        logActionHook(hookLabel)
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
    "Loaded wallet lock build. targetGold=%s persistentGold=%s targetPersistentGold=%s persistentSoul=%s targetPersistentSoul=%s persistentTicket=%s ticketKey=%s targetPersistentTickets=%s persistentXpFields=%s targetPersistentXpFields=%s scanIntervalMs=%s actionHooks=%s debug=%s.",
    tostring(settings.targetGold),
    tostring(settings.enablePersistentGold),
    tostring(settings.targetPersistentGold),
    tostring(settings.enablePersistentSoul),
    tostring(settings.targetPersistentSoul),
    tostring(settings.enablePersistentTickets),
    tostring(settings.ticketWalletKey),
    tostring(settings.targetPersistentTickets),
    tostring(settings.enablePersistentXpFields),
    tostring(settings.targetPersistentXpFields),
    tostring(settings.scanIntervalMs),
    tostring(settings.enableActionHooks),
    tostring(settings.debug)
))

LoopAsync(settings.scanIntervalMs, function()
    if not settings.enabled then
        return false
    end

    tickCount = tickCount + 1
    registerActionHooks()

    if tickCount % settings.persistentScanEveryTicks == 0 then
        syncPersistentWallets("tick", tickCount % 30 == 0)
    end

    local goldState = findGameStateGold()
    if not goldState then
        if settings.debug and not hasLoggedWaiting then
            hasLoggedWaiting = true
            Log("Waiting for BP_GameState_C gold fields...")
        end
        return false
    end

    if not hasLoggedTarget then
        hasLoggedTarget = true
        Log(string.format("Gold fields detected. Current gold=%s.", tostring(goldState.currentGold)))
    end

    if goldState.currentGold < settings.refillBelow then
        local ok, err = setGold(goldState, settings.targetGold)
        if ok then
            if lastRefillSourceGold ~= goldState.currentGold then
                Log(string.format(
                    "Gold refilled from %s to %s. pickedUpGolds=%s localUsedGolds=%s.",
                    tostring(goldState.currentGold),
                    tostring(settings.targetGold),
                    tostring(goldState.pickedUpGolds),
                    tostring(goldState.localUsedGolds)
                ))
            end
            lastRefillSourceGold = goldState.currentGold
        elseif settings.debug then
            Log("Gold refill failed: " .. tostring(err))
        end
    elseif settings.debug and tickCount % 30 == 0 then
        Log(string.format("Gold OK: %s.", tostring(goldState.currentGold)))
    end

    return false
end)
