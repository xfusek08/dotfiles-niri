local ui = require("yazi.ui")
local Folder = require("yazi.folder")

local my_linemode = {}

function my_linemode:render(area, files)
    -- your custom linemode code here, e.g. show permissions, owner, size
    local lines = {}
    for _, f in ipairs(files) do
        local perm = f:perm() or "---------"
        local owner = ya.user_name(f.cha.uid) or tostring(f.cha.uid)
        local group = ya.group_name(f.cha.gid) or tostring(f.cha.gid)
        local size = ya.readable_size(f:size()) or "-"
        local name = f:name()

        lines[#lines + 1] = ui.Line({
            ui.Span(perm .. " "),
            ui.Span(owner .. ":" .. group .. " "),
            ui.Span(size .. " "),
            ui.Span(name),
        })
    end
    return ui.Paragraph(area, lines)
end

-- Register the linemode
Folder.linemodes["custom"] = my_linemode
