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
