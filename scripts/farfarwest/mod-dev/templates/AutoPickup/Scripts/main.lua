local MOD_NAME = "AutoPickup"
local SETTINGS_PATH = "ue4ss/Mods/AutoPickup/config/settings.json"

local settings = {
    enabled = true,
    autoPickup = true,
    scanIntervalMs = 350,
    pickupRadius = 375,
    scanAllLoadedLevels = true,
    trackConstructedActors = true,
    maxLevelsPerTick = 12,
    maxActorsPerTick = 450,
    maxTrackedActors = 240,
    maxCandidatesPerTick = 8,
    retryCooldownTicks = 8,
    candidateLogLimit = 80,
    nearbyDiscoveryLogLimit = 80,
    debugSummaryEveryTicks = 20,
    debug = false,
}

local UEHelpers = nil
local tickCount = 0
local actorsPropertyRegistered = false
local hasLoggedStarted = false
local hasLoggedWaitingForPlayer = false
local hasLoggedWaitingForLevel = false
local candidateLogs = 0
local discoveryLogs = 0
local lastPlayerKey = nil
local actorTrackingRegistered = false
local trackedActorCount = 0
local seenCandidateClasses = {}
local seenDiscoveryActors = {}
local trackedActors = {}
local functionCache = {}
local attemptedActors = {}
local getActiveLevels = nil
local forEachLoadedActor = nil
local getFullName = nil
local getClassName = nil
local getAddressKey = nil
local getLocation = nil

local pickupTokens = {
    "pickup",
    "pick_up",
    "pickable",
    "collect",
    "loot",
    "drop",
    "pack",
    "crate",
    "kit",
    "potion",
    "vial",
}

local resourceTokens = {
    "ammo",
    "health",
    "heal",
    "healing",
    "heart",
    "life",
    "med",
    "medkit",
    "medical",
    "aid",
    "bandage",
    "potion",
    "vial",
    "elixir",
    "shell",
    "round",
    "cartridge",
    "magazine",
}

local excludeActorTokens = {
    "widget",
    "ui_",
    "_ui",
    "material",
    "texture",
    "sound",
    "audio",
    "camera",
    "light",
    "volume",
    "trigger",
    "spawner",
    "manager",
    "data",
    "datatable",
    "enemy",
    "npc",
    "player",
    "projectile",
    "mesh",
    "component",
}

local functionTokens = {
    "pickup",
    "pick_up",
    "collect",
    "take",
    "loot",
    "interact",
    "use",
}

local overlapFunctionTokens = {
    "beginoverlap",
    "begin_overlap",
    "componentbeginoverlap",
}

local excludeFunctionTokens = {
    "can",
    "get",
    "set",
    "update",
    "refresh",
    "display",
    "tooltip",
    "construct",
    "destruct",
    "receive",
    "executeubergraph",
    "delegate",
    "signature",
    "debug",
    "sound",
    "anim",
    "spawn",
    "destroyed",
}

local function Log(message)
    print(string.format("[%s] %s\n", MOD_NAME, tostring(message)))
end

local function lower(value)
    return string.lower(tostring(value or ""))
end

local function containsAny(text, tokens)
    local lowered = lower(text)
    for _, token in ipairs(tokens) do
        if string.find(lowered, token, 1, true) then
            return true
        end
    end
    return false
end

local function boolValue(content, key, current)
    local value = string.match(content, '"' .. key .. '"%s*:%s*(%a+)')
    if value == "true" then return true end
    if value == "false" then return false end
    return current
end

local function numberValue(content, key, current)
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

    settings.enabled = boolValue(content, "enabled", settings.enabled)
    settings.autoPickup = boolValue(content, "autoPickup", settings.autoPickup)
    settings.scanAllLoadedLevels = boolValue(content, "scanAllLoadedLevels", settings.scanAllLoadedLevels)
    settings.trackConstructedActors = boolValue(content, "trackConstructedActors", settings.trackConstructedActors)
    settings.debug = boolValue(content, "debug", settings.debug)
    settings.scanIntervalMs = numberValue(content, "scanIntervalMs", settings.scanIntervalMs)
    settings.pickupRadius = numberValue(content, "pickupRadius", settings.pickupRadius)
    settings.maxLevelsPerTick = numberValue(content, "maxLevelsPerTick", settings.maxLevelsPerTick)
    settings.maxActorsPerTick = numberValue(content, "maxActorsPerTick", settings.maxActorsPerTick)
    settings.maxTrackedActors = numberValue(content, "maxTrackedActors", settings.maxTrackedActors)
    settings.maxCandidatesPerTick = numberValue(content, "maxCandidatesPerTick", settings.maxCandidatesPerTick)
    settings.retryCooldownTicks = numberValue(content, "retryCooldownTicks", settings.retryCooldownTicks)
    settings.candidateLogLimit = numberValue(content, "candidateLogLimit", settings.candidateLogLimit)
    settings.nearbyDiscoveryLogLimit = numberValue(content, "nearbyDiscoveryLogLimit", settings.nearbyDiscoveryLogLimit)
    settings.debugSummaryEveryTicks = numberValue(content, "debugSummaryEveryTicks", settings.debugSummaryEveryTicks)

    if settings.scanIntervalMs < 100 then settings.scanIntervalMs = 100 end
    if settings.pickupRadius < 50 then settings.pickupRadius = 50 end
    if settings.maxLevelsPerTick < 1 then settings.maxLevelsPerTick = 1 end
    if settings.maxActorsPerTick < 50 then settings.maxActorsPerTick = 50 end
    if settings.maxTrackedActors < 0 then settings.maxTrackedActors = 0 end
    if settings.maxCandidatesPerTick < 1 then settings.maxCandidatesPerTick = 1 end
    if settings.retryCooldownTicks < 1 then settings.retryCooldownTicks = 1 end
    if settings.debugSummaryEveryTicks < 0 then settings.debugSummaryEveryTicks = 0 end
end

local function isValidObject(object)
    local ok, valid = pcall(function()
        return object and object:IsValid()
    end)
    return ok and valid
end

local function requireUEHelpers()
    if UEHelpers then
        return UEHelpers
    end

    local ok, helpers = pcall(function()
        return require("UEHelpers")
    end)
    if ok and helpers then
        UEHelpers = helpers
    end
    return UEHelpers
end

local function registerActorsProperty()
    if actorsPropertyRegistered then
        return
    end

    local ok = pcall(function()
        RegisterCustomProperty({
            ["Name"] = "Actors",
            ["Type"] = PropertyTypes.ArrayProperty,
            ["BelongsToClass"] = "/Script/Engine.Level",
            ["OffsetInternal"] = 0x98,
            ["ArrayProperty"] = {
                ["Type"] = PropertyTypes.ObjectProperty,
            },
        })
    end)

    actorsPropertyRegistered = ok
end

local function getPlayerPawn()
    local helpers = requireUEHelpers()
    if helpers then
        local ok, player = pcall(function()
            return helpers.GetPlayer()
        end)
        if ok and isValidObject(player) then
            return player
        end
    end

    local ok, controllers = pcall(function()
        return FindAllOf("PlayerController")
    end)
    if ok and controllers then
        for _, controller in ipairs(controllers) do
            if isValidObject(controller) then
                local pawnOk, pawn = pcall(function()
                    return controller.Pawn
                end)
                if pawnOk and isValidObject(pawn) then
                    return pawn
                end
            end
        end
    end

    if forEachLoadedActor then
        local foundPlayer = nil
        forEachLoadedActor(getActiveLevels and getActiveLevels() or {}, function(actor)
            if foundPlayer or not isValidObject(actor) then
                return foundPlayer ~= nil
            end

            local controlledOk, controlled = pcall(function()
                return actor:IsPlayerControlled()
            end)
            if controlledOk and controlled then
                foundPlayer = actor
                return true
            end

            local controllerOk, controller = pcall(function()
                return actor:GetController()
            end)
            if controllerOk and isValidObject(controller) then
                local localOk, isLocal = pcall(function()
                    return controller:IsLocalPlayerController()
                end)
                if localOk and isLocal then
                    foundPlayer = actor
                    return true
                end
            end

            local text = lower(getClassName(actor) .. " " .. getFullName(actor))
            if getLocation(actor)
                and (string.find(text, "player", 1, true) or string.find(text, "hero", 1, true))
                and not containsAny(text, { "controller", "state", "camera", "widget", "ui_", "_ui", "npc", "enemy" }) then
                foundPlayer = actor
                return true
            end

            return false
        end)

        if foundPlayer then
            return foundPlayer
        end
    end

    return nil
end

local function getPersistentLevel()
    local helpers = requireUEHelpers()
    if helpers then
        local ok, level = pcall(function()
            return helpers.GetPersistentLevel()
        end)
        if ok and isValidObject(level) then
            return level
        end
    end

    local ok, level = pcall(function()
        return FindFirstOf("Level")
    end)
    if ok and isValidObject(level) then
        return level
    end

    return nil
end

local function appendUniqueLevel(levels, seen, level)
    if not isValidObject(level) then
        return
    end

    local key = getAddressKey(level)
    if seen[key] then
        return
    end

    seen[key] = true
    table.insert(levels, level)
end

getActiveLevels = function()
    local levels = {}
    local seen = {}

    appendUniqueLevel(levels, seen, getPersistentLevel())

    if settings.scanAllLoadedLevels then
        local ok, allLevels = pcall(function()
            return FindAllOf("Level")
        end)
        if ok and allLevels then
            for _, level in ipairs(allLevels) do
                appendUniqueLevel(levels, seen, level)
                if #levels >= settings.maxLevelsPerTick then
                    break
                end
            end
        end
    elseif #levels == 0 then
        local ok, level = pcall(function()
            return FindFirstOf("Level")
        end)
        if ok then
            appendUniqueLevel(levels, seen, level)
        end
    end

    return levels
end

local function unwrapActor(element)
    local unwrapOk, unwrapped = pcall(function()
        return element:get()
    end)
    if unwrapOk then
        return unwrapped
    end
    return element
end

forEachLoadedActor = function(levels, callback)
    local scanned = 0

    for _, level in ipairs(levels) do
        if scanned >= settings.maxActorsPerTick then
            break
        end

        local actorsOk, actors = pcall(function()
            return level.Actors
        end)
        if actorsOk and actors then
            local stopLevel = false
            pcall(function()
                actors:ForEach(function(_, element)
                    if scanned >= settings.maxActorsPerTick then
                        return true
                    end

                    scanned = scanned + 1
                    local shouldStop = callback(unwrapActor(element), level)
                    if shouldStop then
                        stopLevel = true
                        return true
                    end
                    return false
                end)
            end)
            if stopLevel then
                break
            end
        end
    end

    return scanned
end

getFullName = function(object)
    local ok, fullName = pcall(function()
        return object:GetFullName()
    end)
    return ok and tostring(fullName) or ""
end

getClassName = function(object)
    local ok, className = pcall(function()
        return object:GetClass():GetFName():ToString()
    end)
    return ok and tostring(className) or ""
end

getAddressKey = function(object)
    local ok, address = pcall(function()
        return object:GetAddress()
    end)
    if ok and address then
        return tostring(address)
    end
    return getFullName(object)
end

getLocation = function(actor)
    local ok, location = pcall(function()
        return actor:K2_GetActorLocation()
    end)
    if not ok or not location then
        return nil
    end

    local x = location.X or location.x
    local y = location.Y or location.y
    local z = location.Z or location.z
    if type(x) ~= "number" or type(y) ~= "number" or type(z) ~= "number" then
        return nil
    end

    return { x = x, y = y, z = z }
end

local function distanceBetween(leftActor, rightActor)
    local directOk, directDistance = pcall(function()
        return leftActor:GetDistanceTo(rightActor)
    end)
    if directOk and type(directDistance) == "number" then
        return directDistance
    end

    local left = getLocation(leftActor)
    local right = getLocation(rightActor)
    if not left or not right then
        return nil
    end

    local dx = left.x - right.x
    local dy = left.y - right.y
    local dz = left.z - right.z
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

local function looksLikePickupActor(actor)
    local className = getClassName(actor)
    local fullName = getFullName(actor)
    local text = lower(className .. " " .. fullName)

    local hasResourceToken = containsAny(text, resourceTokens)
    local hasPickupToken = containsAny(text, pickupTokens)

    if containsAny(text, excludeActorTokens) then
        return false
    end

    return hasResourceToken
        or hasPickupToken and containsAny(text, { "ammo", "health", "healing", "med" })
        or string.find(text, "ammopickup", 1, true) ~= nil
        or string.find(text, "healthpickup", 1, true) ~= nil
        or string.find(text, "pickupammo", 1, true) ~= nil
        or string.find(text, "pickuphealth", 1, true) ~= nil
end

local function looksWorthTrackingActor(actor)
    local text = lower(getClassName(actor) .. " " .. getFullName(actor))
    local hasResourceToken = containsAny(text, resourceTokens)
    if not hasResourceToken then
        return false
    end
    if containsAny(text, excludeActorTokens) then
        return false
    end
    return true
end

local function functionName(func)
    local ok, name = pcall(function()
        return func:GetFName():ToString()
    end)
    if ok and name then
        return tostring(name)
    end

    local getNameOk, getName = pcall(function()
        return func:GetName()
    end)
    return getNameOk and tostring(getName) or nil
end

local function functionScore(name)
    local text = lower(name)
    if containsAny(text, excludeFunctionTokens) then
        return 0
    end

    local score = 0
    if string.find(text, "pickup", 1, true) or string.find(text, "pick_up", 1, true) then score = score + 8 end
    if string.find(text, "collect", 1, true) then score = score + 7 end
    if string.find(text, "take", 1, true) then score = score + 6 end
    if string.find(text, "loot", 1, true) then score = score + 5 end
    if string.find(text, "interact", 1, true) then score = score + 4 end
    if string.find(text, "use", 1, true) then score = score + 3 end
    if containsAny(text, overlapFunctionTokens) then score = score + 1 end
    if not containsAny(text, functionTokens) and not containsAny(text, overlapFunctionTokens) then score = 0 end
    return score
end

local function gatherPickupFunctions(actor)
    local className = getClassName(actor)
    if functionCache[className] then
        return functionCache[className]
    end

    local entries = {}
    local classOk, classObject = pcall(function()
        return actor:GetClass()
    end)
    if classOk and isValidObject(classObject) then
        pcall(function()
            classObject:ForEachFunction(function(func)
                local name = functionName(func)
                if name then
                    local score = functionScore(name)
                    if score > 0 then
                        table.insert(entries, { name = name, score = score })
                    end
                end
            end)
        end)
    end

    table.sort(entries, function(left, right)
        if left.score ~= right.score then
            return left.score > right.score
        end
        return left.name < right.name
    end)

    functionCache[className] = entries
    return entries
end

local function logCandidate(actor, functions)
    if not settings.debug then
        return
    end

    local className = getClassName(actor)
    if seenCandidateClasses[className] then
        return
    end
    if candidateLogs >= settings.candidateLogLimit then
        return
    end

    local functionNames = {}
    for index, entry in ipairs(functions) do
        if index > 6 then break end
        table.insert(functionNames, entry.name)
    end

    seenCandidateClasses[className] = true
    candidateLogs = candidateLogs + 1
    Log(string.format(
        "Candidate class: %s funcs=[%s] sample=%s",
        className,
        table.concat(functionNames, ","),
        getFullName(actor)
    ))
end

local function logDiscoveryActor(actor, reason, distance)
    if not settings.debug or discoveryLogs >= settings.nearbyDiscoveryLogLimit then
        return
    end

    local key = getAddressKey(actor)
    if seenDiscoveryActors[key] then
        return
    end

    seenDiscoveryActors[key] = true
    discoveryLogs = discoveryLogs + 1
    local distanceText = distance and tostring(math.floor(distance)) or "n/a"
    Log(string.format(
        "Discovery actor: reason=%s distance=%s class=%s sample=%s",
        tostring(reason),
        distanceText,
        getClassName(actor),
        getFullName(actor)
    ))
end

local function trackPotentialActor(actor, reason)
    if not settings.trackConstructedActors or settings.maxTrackedActors == 0 then
        return
    end
    if trackedActorCount >= settings.maxTrackedActors then
        return
    end
    if not isValidObject(actor) or not looksWorthTrackingActor(actor) then
        return
    end

    local key = getAddressKey(actor)
    if trackedActors[key] then
        return
    end

    trackedActors[key] = actor
    trackedActorCount = trackedActorCount + 1
    logDiscoveryActor(actor, reason or "tracked", nil)
end

local function registerActorTracking()
    if actorTrackingRegistered or not settings.trackConstructedActors then
        return
    end

    local ok = pcall(function()
        NotifyOnNewObject("/Script/Engine.Actor", function(actor)
            trackPotentialActor(actor, "constructed")
        end)
    end)

    actorTrackingRegistered = ok
    if settings.debug then
        Log(ok and "Actor construction tracking enabled." or "Actor construction tracking unavailable.")
    end
end

local function tryInvokePickup(actor, player, functions)
    if #functions == 0 then
        return false, "no pickup-like functions"
    end

    for _, entry in ipairs(functions) do
        local methodOk, method = pcall(function()
            return actor[entry.name]
        end)
        if methodOk and type(method) == "function" then
            local variants = {
                function() return method(actor, player) end,
                function() return method(actor) end,
                function() return method(actor, player, player) end,
                function() return method(actor, player, actor) end,
            }

            for _, variant in ipairs(variants) do
                local callOk = pcall(variant)
                if callOk then
                    return true, entry.name
                end
            end
        end
    end

    return false, "calls failed"
end

local function inspectActorForPickup(actor, player, stats)
    if not isValidObject(actor) or actor == player then
        return false
    end

    local text = lower(getClassName(actor) .. " " .. getFullName(actor))
    local hasResourceToken = containsAny(text, resourceTokens)
    local hasPickupToken = containsAny(text, pickupTokens)

    if hasResourceToken then
        stats.resourceLike = stats.resourceLike + 1
    end
    if hasPickupToken then
        stats.pickupLike = stats.pickupLike + 1
    end

    local distance = nil
    if hasResourceToken or hasPickupToken then
        distance = distanceBetween(player, actor)
        if distance and distance <= settings.pickupRadius * 2 then
            stats.nearbyResourceLike = stats.nearbyResourceLike + 1
            logDiscoveryActor(actor, hasResourceToken and "resource-token" or "pickup-token", distance)
        end
    end

    if not looksLikePickupActor(actor) then
        return false
    end

    if not distance then
        distance = distanceBetween(player, actor)
    end
    if not distance or distance > settings.pickupRadius then
        return false
    end

    stats.candidates = stats.candidates + 1
    local functions = gatherPickupFunctions(actor)
    logCandidate(actor, functions)

    if not settings.autoPickup then
        return false
    end

    local key = getAddressKey(actor)
    local lastAttempt = attemptedActors[key]
    if lastAttempt and tickCount - lastAttempt < settings.retryCooldownTicks then
        return false
    end
    attemptedActors[key] = tickCount

    local ok, message = tryInvokePickup(actor, player, functions)
    if ok then
        if settings.debug then
            Log(string.format("Auto pickup attempt: %s via %s distance=%d", getClassName(actor), tostring(message), math.floor(distance)))
        end
    elseif settings.debug then
        Log(string.format("Auto pickup skipped: %s %s", getClassName(actor), tostring(message)))
    end

    return stats.candidates >= settings.maxCandidatesPerTick
end

local function scanActors()
    local player = getPlayerPawn()
    if not player then
        if settings.debug and (not hasLoggedWaitingForPlayer or (settings.debugSummaryEveryTicks > 0 and tickCount % settings.debugSummaryEveryTicks == 0)) then
            hasLoggedWaitingForPlayer = true
            local levels = getActiveLevels and getActiveLevels() or {}
            Log(string.format("Waiting for local player pawn... levels=%d", #levels))
        end
        return
    end

    local playerKey = getAddressKey(player)
    if settings.debug and playerKey ~= lastPlayerKey then
        lastPlayerKey = playerKey
        Log(string.format("Local player pawn detected: class=%s sample=%s", getClassName(player), getFullName(player)))
    end

    local levels = getActiveLevels()
    if #levels == 0 then
        if settings.debug and not hasLoggedWaitingForLevel then
            hasLoggedWaitingForLevel = true
            Log("Waiting for loaded levels...")
        end
        return
    end

    local stats = {
        candidates = 0,
        resourceLike = 0,
        pickupLike = 0,
        nearbyResourceLike = 0,
    }

    local scanned = forEachLoadedActor(levels, function(actor)
        if stats.candidates >= settings.maxCandidatesPerTick then
            return true
        end
        return inspectActorForPickup(actor, player, stats)
    end)

    local trackedScanned = 0
    if settings.trackConstructedActors and stats.candidates < settings.maxCandidatesPerTick then
        for key, actor in pairs(trackedActors) do
            if scanned + trackedScanned >= settings.maxActorsPerTick or stats.candidates >= settings.maxCandidatesPerTick then
                break
            end
            if not isValidObject(actor) then
                trackedActors[key] = nil
                if trackedActorCount > 0 then
                    trackedActorCount = trackedActorCount - 1
                end
            else
                trackedScanned = trackedScanned + 1
                if inspectActorForPickup(actor, player, stats) then
                    break
                end
            end
        end
    end

    if settings.debug and settings.debugSummaryEveryTicks > 0 and tickCount % settings.debugSummaryEveryTicks == 0 then
        Log(string.format(
            "Scan summary: levels=%d scanned=%d tracked=%d resourceLike=%d pickupLike=%d nearbyResourceLike=%d candidates=%d player=%s",
            #levels,
            scanned + trackedScanned,
            trackedActorCount,
            stats.resourceLike,
            stats.pickupLike,
            stats.nearbyResourceLike,
            stats.candidates,
            getClassName(player)
        ))
    end
end

pcall(registerActorsProperty)
loadSettings()
registerActorTracking()
Log(string.format(
    "Loaded. autoPickup=%s radius=%s scanIntervalMs=%s tracking=%s debug=%s.",
    tostring(settings.autoPickup),
    tostring(settings.pickupRadius),
    tostring(settings.scanIntervalMs),
    tostring(settings.trackConstructedActors),
    tostring(settings.debug)
))

LoopAsync(settings.scanIntervalMs, function()
    if not settings.enabled then
        return false
    end

    tickCount = tickCount + 1
    if not hasLoggedStarted then
        hasLoggedStarted = true
        Log("Loop started. Scanning active level actors near player only.")
    end

    scanActors()

    return false
end)