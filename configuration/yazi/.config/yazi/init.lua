function Linemode:size_enhanced()
    local f = self._file
    local size = f:size()
    
    -- Format size in a more readable way
    local size_str
    if size then
        local readable = ya.readable_size(size)
        -- Remove space and format nicely
        size_str = readable:gsub(" ", "")
        -- Right-align the size (pad to 7 characters for consistent layout)
        size_str = string.format("%7s", size_str)
    else
        size_str = "      -"
    end
    
    local mtime = math.floor(f.cha.mtime or 0)
    local time = (mtime ~= 0) and (os.date("%b %d %H:%M", mtime) or "") or "-"
    
    return ui.Line(string.format("%s %s", size_str, time))
end
