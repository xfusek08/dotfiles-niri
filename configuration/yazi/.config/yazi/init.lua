-- Based on: https://github.com/sxyazi/yazi/discussions/3263

local MATERIAL_BLUE_GRAY = {
    [50] = '#ECEFF1',
    [100] = '#CFD8DC',
    [200] = '#B0BEC5',
    [300] = '#90A4AE',
    [400] = '#78909C',
    [500] = '#607D8B',
    [600] = '#546E7A',
    [700] = '#455A64',
    [800] = '#37474F',
    [900] = '#263238',
}

local MINUTE = 1
local HOUR = 60 * MINUTE
local DAY = 24 * HOUR
local MONTH = 30 * DAY
local YEAR = 365 * DAY

local MiB = 1
local GiB = 1024 * MiB

--- @class StyleThreshold
--- @field upper number
--- @field fg AsColor
--- @field reverse boolean?

--- @type StyleThreshold[]
local TIME_STYLE_THRESHOLDS = {
    { upper = MINUTE,      fg = 'red',                  reverse = true },
    { upper = 10 * MINUTE, fg = 'yellow',               reverse = true },
    { upper = HOUR,        fg = 'green',                reverse = true },
    { upper = 12 * HOUR,   fg = 'blue',                 reverse = true },
    { upper = DAY,         fg = 'white',                reverse = true },
    ---
    { upper = 2 * DAY,     fg = 'red' },
    { upper = 7 * DAY,     fg = 'yellow' },
    { upper = 14 * DAY,    fg = 'green' },
    { upper = MONTH,       fg = 'blue' },
    { upper = 6 * MONTH,   fg = 'white' },
    ---
    { upper = YEAR,        fg = MATERIAL_BLUE_GRAY[200] },
    { upper = 5 * YEAR,    fg = MATERIAL_BLUE_GRAY[400] },
    { upper = math.huge,   fg = MATERIAL_BLUE_GRAY[600] },
}

--- @type StyleThreshold[]
local SIZE_STYLE_THRESHOLDS = {
    { upper = MiB,       fg = MATERIAL_BLUE_GRAY[600] },
    { upper = 10 * MiB,  fg = MATERIAL_BLUE_GRAY[400] },
    { upper = 20 * MiB,  fg = MATERIAL_BLUE_GRAY[200] },
    ---
    { upper = 50 * MiB,  fg = 'white' },
    { upper = 100 * MiB, fg = 'blue' },
    { upper = 200 * MiB, fg = 'cyan' },
    { upper = 500 * MiB, fg = 'green' },
    { upper = GiB,       fg = 'yellow' },
    { upper = 2 * GiB,   fg = 'red' },
    ---
    { upper = 5 * GiB,   fg = 'yellow',               reverse = true },
    { upper = math.huge, fg = 'red',                  reverse = true },
}

---@param thresholds StyleThreshold[]
---@param value number
---@return ui.Style
local function lookup_style(thresholds, value)
    local style = ui.Style()
    for _, t in ipairs(thresholds) do
        if value < t.upper then
            if t.reverse then
                style = style:bg('black'):reverse()
            end

            style = style:fg(t.fg)
            break
        end
    end
    return style
end

--- @param time integer
--- @return ui.Span
local function format_time(time)
    if not time then
        return ui.Span('-')
    end

    local date = os.date('%Y-%m-%d', time)
    local now = os.time()

    local text
    if date == os.date('%Y-%m-%d', now) then
        text = os.date('%H:%M:%S', time)
    elseif os.date('%Y', time) == os.date('%Y', now) then
        text = os.date('%m-%d %H:%M', time)
    else
        text = date
    end

    local elapsed = (now - time) / 60 -- min
    local style = lookup_style(TIME_STYLE_THRESHOLDS, elapsed)

    return ui.Span(string.format('%11s', text)):style(style)
end

--- @param size integer
--- @return ui.Span
local function format_size(size)
    if not size then
        return ui.Span(string.format('%7s', '-'))
    end

    local text = ya.readable_size(size)
    local s = size / 1024 / 1024 -- MiB
    local style = lookup_style(SIZE_STYLE_THRESHOLDS, s)

    return ui.Span(string.format('%7s', text)):style(style)
end

--- @param perm string
--- @return ui.Line
local function format_permissions(perm)
    if not perm or perm == "" then
        return ui.Span('-')
    end

    local spans = {}

    for i = 1, #perm do
        local char = perm:sub(i, i)
        local style = nil

        if char == "r" then
            style = ui.Style():fg("yellow")
        elseif char == "w" then
            style = ui.Style():fg("red")
        elseif char == "x" then
            style = ui.Style():fg("green")
        elseif char == "s" or char == "S" or char == "t" or char == "T" then
            style = ui.Style():fg("magenta"):bold()
        elseif char == "-" then
            style = ui.Style():fg("darkgray")
        else
            style = ui.Style():fg("cyan")
        end

        table.insert(spans, ui.Span(char):style(style))
    end

    return ui.Line(spans)
end

function Linemode:btime()
    local time = math.floor(self._file.cha.btime or 0)
    return format_time(time)
end

function Linemode:mtime()
    local time = math.floor(self._file.cha.mtime or 0)
    return format_time(time)
end

function Linemode:size()
    return format_size(self._file:size())
end

function Linemode:size_and_mtime()
    local time = math.floor(self._file.cha.mtime or 0)
    local s = format_size(self._file:size())
    local t = format_time(time)
    return ui.Line({ s, ' ', t })
end

function Linemode:permissions_size()
    local perm = self._file.cha:perm() or ""
    local p = format_permissions(perm)
    local s = format_size(self._file:size())
    return ui.Line({ p, ' ', s })
end

-------------------------------
---- Plugin configurations ----
-------------------------------

-- https://github.com/boydaihungst/pref-by-location.yazi

local pref_by_location = require("pref-by-location")
pref_by_location:setup({
    -- Disable this plugin completely.
    -- disabled = false -- true|false (Optional)

    -- Hide "enable" and "disable" notifications.
    -- no_notify = false -- true|false (Optional)

    -- Disable the fallback/default preference (values in `yazi.toml`).
    -- This mean if none of the saved or predefined preferences is matched,
    -- then it won't reset preference to default values in yazi.toml.
    -- For example, go from folder A to folder B (folder B matches saved preference to show hidden files) -> show hidden.
    -- Then move back to folder A -> keep showing hidden files, because the folder A doesn't match any saved or predefined preference.
    -- disable_fallback_preference = false -- true|false|nil (Optional)

    -- You can backup/restore this file. But don't use same file in the different OS.
    -- save_path =  -- full path to save file (Optional)
    --       - Linux/MacOS: os.getenv("HOME") .. "/.config/yazi/pref-by-location"
    --       - Windows: os.getenv("APPDATA") .. "\\yazi\\config\\pref-by-location"

    -- https://github.com/MasouShizuka/projects.yazi compatibility
    -- If you use projects.yazi plugin and changed it's default yazi_load_event config, you have to set this value to equal projects.yazi > setup function > save > yazi_load_event. Default is "@projects-load"
    -- project_plugin_load_event = "@projects-load" -- string (Optional)

    -- This is predefined preferences.
    prefs = { -- (Optional)
        -- location: String | Lua pattern (Required)
        --   - Support literals full path, lua pattern (string.match pattern): https://www.lua.org/pil/20.2.html
        --     And don't put ($) sign at the end of the location. %$ is ok.
        --   - If you want to use special characters (such as . * ? + [ ] ( ) ^ $ %) in "location"
        --     you need to escape them with a percent sign (%) or use a helper function `pref_by_location.is_literal_string`
        --     Example: "/home/test/Hello (Lua) [world]" => { location = "/home/test/Hello %(Lua%) %[world%]", ....}
        --     or { location = pref_by_location.is_literal_string("/home/test/Hello (Lua) [world]"), .....}

        -- sort: {} (Optional) https://yazi-rs.github.io/docs/configuration/yazi#mgr.sort_by
        --   - extension: "none"|"mtime"|"btime"|"extension"|"alphabetical"|"natural"|"size"|"random", (Optional)
        --   - reverse: true|false (Optional)
        --   - dir_first: true|false (Optional)
        --   - translit: true|false (Optional)
        --   - sensitive: true|false (Optional)

        -- linemode: "none" |"size" |"btime" |"mtime" |"permissions" |"owner" (Optional) https://yazi-rs.github.io/docs/configuration/yazi#mgr.linemode
        --   - Custom linemode also work. See the example below

        -- show_hidden: true|false (Optional) https://yazi-rs.github.io/docs/configuration/yazi#mgr.show_hidden

        -- Some examples:
        -- Match any folder which has path start with "/mnt/remote/". Example: /mnt/remote/child/child2
        -- { location = "^/mnt/remote/.*",                                       sort = { "extension", reverse = false, dir_first = true, sensitive = false } },
        -- Match any folder with name "Downloads"
        { location = "~/Stažené",   sort = { "btime", reverse = true, dir_first = true }, linemode = "btime" },
        { location = "~/Downloads", sort = { "btime", reverse = true, dir_first = true }, linemode = "btime" },
        -- Match exact folder with absolute path "/home/test/Videos".
        -- Use helper function `pref_by_location.is_literal_string` to prevent the case where the path contains special characters
        -- { location = pref_by_location.is_literal_string("/home/test/Videos"), sort = { "btime", reverse = true, dir_first = true },                        linemode = "btime" },

        -- show_hidden for any folder with name "secret"
        -- {
        --     location = ".*/secret",
        --     sort = { "natural", reverse = false, dir_first = true },
        --     linemode = "size",
        --     show_hidden = true,
        -- },

        -- Custom linemode also work
        -- {
        --     location = ".*/abc",
        --     linemode = "size_and_mtime",
        -- },
        -- DO NOT ADD location = ".*". Which currently use your yazi.toml config as fallback.
        -- That mean if none of the saved perferences is matched, then it will use your config from yazi.toml.
        -- So change linemode, show_hidden, sort_xyz in yazi.toml instead.
    },
})
