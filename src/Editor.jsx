import React from 'react'

const Editor = ({ value, onChange, language }) => {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[340px] font-mono text-sm border rounded p-3"
            />
            <div className="text-xs text-gray-500 mt-2">Editing as: {language}</div>
        </div>

    )
}

export default Editor