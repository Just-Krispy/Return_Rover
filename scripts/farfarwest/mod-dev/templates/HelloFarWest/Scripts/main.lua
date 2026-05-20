local MOD_NAME = "HelloFarWest"
local SETTINGS_PATH = "ue4ss/Mods/HelloFarWest/config/settings.json"

local settings = {
    enabled = true,
    debug = true,
    scanIntervalMs = 3000,
}

local initialized = false
local tickCount = 0

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

    settings.enabled = boolValue("enabled", settings.enabled)
    settings.debug = boolValue("debug", settings.debug)
    settings.scanIntervalMs = numberValue("scanIntervalMs", settings.scanIntervalMs)
end

local function safeFindGameState()
    local ok, states = pcall(function()
        return FindAllOf("BP_GameState_C")
    end)
    if not ok or not states then
        return nil
    end

    for _, state in ipairs(states) do
        local validOk, valid = pcall(function()
            return state and state:IsValid()
        end)
        if validOk and valid then
            return state
        end
    end

    return nil
end

loadSettings()
Log("Loaded. This starter mod only logs and detects game state; it does not change gameplay.")

LoopAsync(settings.scanIntervalMs, function()
    if not settings.enabled then
        return false
    end

    if not initialized then
        initialized = true
        Log("Loop started.")
    end

    tickCount = tickCount + 1
    if settings.debug and tickCount % 5 == 0 then
        local gameState = safeFindGameState()
        if gameState then
            Log("BP_GameState_C detected; modding environment is alive.")
        else
            Log("Waiting for BP_GameState_C...")
        end
    end

    return false
end)
