import React, { useState, useEffect } from 'react';
import { Copy, Download, Settings, Upload } from 'lucide-react';

const RobloxPreview = ({ code }) => {
  const [previewElements, setPreviewElements] = useState([]);

  useEffect(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'text/html');
      const elements = Array.from(doc.body.children).map(child => 
        processElementsForPreview(child)
      ).filter(Boolean);
      setPreviewElements(elements);
    } catch (error) {
      setPreviewElements([]);
    }
  }, [code]);

  const processElementsForPreview = (element) => {
    if (!element || element.nodeType !== 1) return null;

    const tagName = element.tagName.toLowerCase();
    const style = element.getAttribute('style') || '';
    const styles = {};
    
    style.split(';').forEach(s => {
      const [key, value] = s.split(':').map(x => x.trim());
      if (key && value) styles[key] = value;
    });

    let elementType = 'frame';
    let text = '';

    if (tagName === 'button') {
      elementType = 'button';
      text = element.textContent.trim();
    } else if (['h1', 'h2', 'h3', 'p', 'span'].includes(tagName)) {
      elementType = 'text';
      text = element.textContent.trim();
    } else if (tagName === 'img') {
      elementType = 'image';
    } else if (tagName === 'div') {
      const hasOnlyText = element.childNodes.length > 0 && 
                          Array.from(element.childNodes).every(node => node.nodeType === 3);
      if (hasOnlyText && element.textContent.trim()) {
        elementType = 'text';
        text = element.textContent.trim();
      }
    }

    let defaultBg = 'transparent';
    
    if (styles['background-color']) {
      defaultBg = styles['background-color'];
    } else if (elementType === 'button') {
      defaultBg = '#ffffff';
    }
    
    const robloxStyle = {
      backgroundColor: defaultBg,
      color: styles['color'] || '#000000',
      padding: styles['padding'] || '0px',
      borderRadius: styles['border-radius'] || '0px',
      width: styles['width'] || '100%',
      height: styles['height'] || 'auto',
      display: styles['display'] || 'block',
      flexDirection: styles['flex-direction'] || 'row',
      gap: styles['gap'] || '0px',
      fontSize: styles['font-size'] || '14px',
      flex: styles['flex'] || 'none',
      border: styles['border'] || 'none',
      textAlign: styles['text-align'] || (elementType === 'button' ? 'center' : 'left'),
      justifyContent: styles['justify-content'] || 'flex-start',
      fontWeight: styles['font-weight'] || 'normal',
    };

    const children = Array.from(element.children).map(child => 
      processElementsForPreview(child)
    ).filter(Boolean);

    return {
      type: elementType,
      text,
      style: robloxStyle,
      children,
      tagName
    };
  };

  const renderElement = (element, index) => {
    if (!element) return null;

    const baseStyle = {
      backgroundColor: element.style.backgroundColor,
      padding: element.style.padding,
      borderRadius: element.style.borderRadius,
      width: element.style.width === '100%' ? '100%' : element.style.width,
      height: element.style.height,
      border: element.style.border,
      boxSizing: 'border-box',
      minHeight: element.style.height === 'auto' ? 'fit-content' : element.style.height,
      overflow: 'hidden',
    };

    if (element.style.display === 'flex') {
      baseStyle.display = 'flex';
      baseStyle.flexDirection = element.style.flexDirection;
      baseStyle.gap = element.style.gap;
      baseStyle.alignItems = 'stretch';
    }

    if (element.style.flex !== 'none') {
      baseStyle.flex = element.style.flex;
      baseStyle.minWidth = '0';
    }

    if (element.type === 'button') {
      return (
        <div
          key={index}
          style={{
            ...baseStyle,
            color: element.style.color,
            fontSize: element.style.fontSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: element.style.textAlign === 'left' ? 'flex-start' : 
                           element.style.textAlign === 'right' ? 'flex-end' : 'center',
            cursor: 'pointer',
            fontFamily: 'GothamSSm, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: '600',
            userSelect: 'none',
            textAlign: element.style.textAlign,
          }}
        >
          {element.text}
        </div>
      );
    }

    if (element.type === 'text') {
      const hasBackground = element.style.backgroundColor && element.style.backgroundColor !== 'transparent';
      
      let fontWeight = element.style.fontWeight;
      if (fontWeight === 'normal' || !fontWeight) {
        fontWeight = '400';
      } else if (fontWeight === 'bold') {
        fontWeight = '700';
      }
      
      return (
        <div
          key={index}
          style={{
            ...baseStyle,
            color: element.style.color,
            fontSize: element.style.fontSize,
            fontFamily: 'GothamSSm, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: fontWeight,
            display: hasBackground ? 'flex' : 'inline-block',
            alignItems: hasBackground ? 'center' : 'initial',
            justifyContent: hasBackground ? 
              (element.style.textAlign === 'left' ? 'flex-start' : 
               element.style.textAlign === 'right' ? 'flex-end' : 'center') : 'initial',
            textAlign: element.style.textAlign,
            lineHeight: '1.2',
            width: hasBackground ? baseStyle.width : 'auto',
            height: hasBackground ? baseStyle.height : 'auto',
            minHeight: hasBackground ? baseStyle.minHeight : 'auto',
          }}
        >
          {element.text}
        </div>
      );
    }

    return (
      <div key={index} style={baseStyle}>
        {element.children && element.children.map((child, i) => renderElement(child, i))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {Array.isArray(previewElements) && previewElements.map((element, i) => renderElement(element, i))}
    </div>
  );
};

const RobloxGuiConverter = () => {
  const [inputCode, setInputCode] = useState(`<div style="display: flex; flex-direction: column; gap: 10px; padding: 20px; background-color: #2c3e50; border-radius: 10px;">
  <h1 style="color: white; font-size: 24px; margin: 0;">Welcome to Roblox</h1>
  <button style="background-color: #3498db; color: white; padding: 12px 24px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Click Me</button>
  <div style="display: flex; gap: 10px;">
    <div style="flex: 1; background-color: #e74c3c; padding: 15px; border-radius: 5px; color: white;">Box 1</div>
    <div style="flex: 1; background-color: #2ecc71; padding: 15px; border-radius: 5px; color: white;">Box 2</div>
  </div>
</div>`);
  const [luaCode, setLuaCode] = useState('');
  const [useScale, setUseScale] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('previews');
  const [inputType, setInputType] = useState('html');

  const extractJSXFromFile = (jsxCode) => {
    let cleaned = jsxCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
    
    const returnMatch = jsxCode.match(/return\s*\(([\s\S]*?)\);?\s*}/);
    if (returnMatch) {
      return returnMatch[1].trim();
    }
    
    const arrowMatch = jsxCode.match(/=>\s*\(([\s\S]*?)\)/);
    if (arrowMatch) {
      return arrowMatch[1].trim();
    }
    
    const directJSXMatch = jsxCode.match(/(<[\s\S]*>)/);
    if (directJSXMatch) {
      return directJSXMatch[1].trim();
    }
    
    return cleaned.trim();
  };

  const convertJSXToHTML = (jsx) => {
    let html = jsx;
    
    html = html.replace(/className=/g, 'class=');
    
    html = html.replace(/style=\{\{([^}]+)\}\}/g, (match, styleContent) => {
      const styles = styleContent
        .split(',')
        .map(s => s.trim())
        .map(s => {
          const [key, value] = s.split(':').map(x => x.trim());
          if (!key || !value) return '';
          
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          const cssValue = value.replace(/['"]/g, '');
          return `${cssKey}: ${cssValue}`;
        })
        .filter(Boolean)
        .join('; ');
      
      return `style="${styles}"`;
    });
    
    html = html.replace(/<(\w+)([^>]*?)\/>/g, '<$1$2></$1>');
    html = html.replace(/\{(['"`])(.*?)\1\}/g, '$2');
    
    return html;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setInputCode(content);
        setInputType('jsx');
      };
      reader.readAsText(file);
    }
  };

  const parseColorUtil = (color) => {
    if (!color) return 'Color3.fromRGB(255, 255, 255)';
    
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `Color3.fromRGB(${r}, ${g}, ${b})`;
    }
    
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return `Color3.fromRGB(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]})`;
    }
    
    const colorMap = {
      'white': 'Color3.fromRGB(255, 255, 255)',
      'black': 'Color3.fromRGB(0, 0, 0)',
      'red': 'Color3.fromRGB(255, 0, 0)',
      'blue': 'Color3.fromRGB(0, 0, 255)',
      'green': 'Color3.fromRGB(0, 255, 0)',
    };
    
    return colorMap[color.toLowerCase()] || 'Color3.fromRGB(255, 255, 255)';
  };

  const parseSizeUtil = (value, isScale) => {
    if (!value) return isScale ? '0' : '0';
    const num = parseInt(value);
    return isScale ? (num / 1000).toFixed(3) : num.toString();
  };

  const convertToLua = (code) => {
    let processCode = code;
    
    if (inputType === 'jsx') {
      const jsxContent = extractJSXFromFile(code);
      processCode = convertJSXToHTML(jsxContent);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(processCode, 'text/html');
    let luaOutput = '-- Generated Roblox Lua GUI Code\n';
    luaOutput += 'local ScreenGui = Instance.new("ScreenGui")\n';
    luaOutput += 'ScreenGui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")\n\n';

    let elementCount = 0;

    const processElement = (element, parent, depth = 0) => {
      if (element.nodeType !== 1) return;

      const tagName = element.tagName.toLowerCase();
      const style = element.getAttribute('style') || '';
      const styles = {};
      
      style.split(';').forEach(s => {
        const [key, value] = s.split(':').map(x => x.trim());
        if (key && value) styles[key] = value;
      });

      let instanceType = 'Frame';
      let instanceName = `Element${elementCount++}`;

      if (tagName === 'button') {
        instanceType = 'TextButton';
        instanceName = 'Button' + elementCount;
      } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'p' || tagName === 'span') {
        instanceType = 'TextLabel';
        instanceName = 'Text' + elementCount;
      } else if (tagName === 'img') {
        instanceType = 'ImageLabel';
        instanceName = 'Image' + elementCount;
      }

      const indent = '  '.repeat(depth);
      luaOutput += `${indent}local ${instanceName} = Instance.new("${instanceType}")\n`;
      luaOutput += `${indent}${instanceName}.Name = "${instanceName}"\n`;
      luaOutput += `${indent}${instanceName}.Parent = ${parent}\n`;

      if (styles['background-color']) {
        luaOutput += `${indent}${instanceName}.BackgroundColor3 = ${parseColorUtil(styles['background-color'])}\n`;
      } else {
        luaOutput += `${indent}${instanceName}.BackgroundTransparency = 1\n`;
      }

      if (styles['border-radius']) {
        luaOutput += `${indent}local ${instanceName}Corner = Instance.new("UICorner")\n`;
        luaOutput += `${indent}${instanceName}Corner.CornerRadius = UDim.new(0, ${parseInt(styles['border-radius'])})\n`;
        luaOutput += `${indent}${instanceName}Corner.Parent = ${instanceName}\n`;
      }

      const width = styles['width'] || '100px';
      const height = styles['height'] || '50px';
      if (useScale) {
        luaOutput += `${indent}${instanceName}.Size = UDim2.new(${parseSizeUtil(width, true)}, 0, ${parseSizeUtil(height, true)}, 0)\n`;
      } else {
        luaOutput += `${indent}${instanceName}.Size = UDim2.new(0, ${parseSizeUtil(width, false)}, 0, ${parseSizeUtil(height, false)})\n`;
      }

      luaOutput += `${indent}${instanceName}.Position = UDim2.new(0, 0, 0, 0)\n`;

      if (instanceType === 'TextLabel' || instanceType === 'TextButton') {
        const text = element.textContent.trim();
        luaOutput += `${indent}${instanceName}.Text = "${text}"\n`;
        
        if (styles['color']) {
          luaOutput += `${indent}${instanceName}.TextColor3 = ${parseColorUtil(styles['color'])}\n`;
        }
        
        if (styles['font-size']) {
          luaOutput += `${indent}${instanceName}.TextSize = ${parseInt(styles['font-size'])}\n`;
        }
        
        luaOutput += `${indent}${instanceName}.Font = Enum.Font.SourceSans\n`;
        luaOutput += `${indent}${instanceName}.TextWrapped = true\n`;
        
        const textAlign = styles['text-align'];
        if (textAlign === 'center') {
          luaOutput += `${indent}${instanceName}.TextXAlignment = Enum.TextXAlignment.Center\n`;
        } else if (textAlign === 'right') {
          luaOutput += `${indent}${instanceName}.TextXAlignment = Enum.TextXAlignment.Right\n`;
        } else {
          if (instanceType === 'TextLabel') {
            luaOutput += `${indent}${instanceName}.TextXAlignment = Enum.TextXAlignment.Left\n`;
          } else {
            luaOutput += `${indent}${instanceName}.TextXAlignment = Enum.TextXAlignment.Center\n`;
          }
        }
        
        if (instanceType === 'TextLabel' && !styles['background-color']) {
          luaOutput += `${indent}${instanceName}.BackgroundTransparency = 1\n`;
        }
      }

      if (styles['padding']) {
        const padding = parseInt(styles['padding']);
        luaOutput += `${indent}local ${instanceName}Padding = Instance.new("UIPadding")\n`;
        luaOutput += `${indent}${instanceName}Padding.PaddingTop = UDim.new(0, ${padding})\n`;
        luaOutput += `${indent}${instanceName}Padding.PaddingBottom = UDim.new(0, ${padding})\n`;
        luaOutput += `${indent}${instanceName}Padding.PaddingLeft = UDim.new(0, ${padding})\n`;
        luaOutput += `${indent}${instanceName}Padding.PaddingRight = UDim.new(0, ${padding})\n`;
        luaOutput += `${indent}${instanceName}Padding.Parent = ${instanceName}\n`;
      }

      if (styles['display'] === 'flex') {
        const isColumn = styles['flex-direction'] === 'column';
        luaOutput += `${indent}local ${instanceName}Layout = Instance.new("UIListLayout")\n`;
        luaOutput += `${indent}${instanceName}Layout.FillDirection = Enum.FillDirection.${isColumn ? 'Vertical' : 'Horizontal'}\n`;
        
        if (styles['gap']) {
          luaOutput += `${indent}${instanceName}Layout.Padding = UDim.new(0, ${parseInt(styles['gap'])})\n`;
        }
        
        luaOutput += `${indent}${instanceName}Layout.Parent = ${instanceName}\n`;
      }

      if (styles['flex']) {
        luaOutput += `${indent}local ${instanceName}FlexConstraint = Instance.new("UIFlexItem")\n`;
        luaOutput += `${indent}${instanceName}FlexConstraint.FlexMode = Enum.UIFlexMode.Fill\n`;
        luaOutput += `${indent}${instanceName}FlexConstraint.Parent = ${instanceName}\n`;
      }

      luaOutput += '\n';

      Array.from(element.children).forEach(child => {
        processElement(child, instanceName, depth + 1);
      });
    };

    const body = doc.body;
    Array.from(body.children).forEach(child => {
      processElement(child, 'ScreenGui', 1);
    });

    return luaOutput;
  };

  useEffect(() => {
    try {
      const lua = convertToLua(inputCode);
      setLuaCode(lua);
    } catch (error) {
      setLuaCode('-- Error parsing code\n-- ' + error.message);
    }
  }, [inputCode, useScale, inputType]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(luaCode);
  };

  const downloadLua = () => {
    const blob = new Blob([luaCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roblox_gui.lua';
    a.click();
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">HTML/CSS/React → Roblox Lua Converter</h1>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-2 transition cursor-pointer">
            <Upload size={18} />
            Upload .jsx
            <input
              type="file"
              accept=".jsx,.js,.tsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2 rounded flex items-center gap-2 transition ${showSettings ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Settings size={18} />
            Settings
          </button>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2 transition"
          >
            <Copy size={18} />
            Copy Lua
          </button>
          <button
            onClick={downloadLua}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2 transition"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useScale}
                onChange={(e) => setUseScale(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Use Scale sizing (responsive) instead of Offset (fixed pixels)</span>
            </label>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Input Type:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  checked={inputType === 'html'}
                  onChange={() => setInputType('html')}
                  className="w-4 h-4"
                />
                <span>HTML/CSS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  checked={inputType === 'jsx'}
                  onChange={() => setInputType('jsx')}
                  className="w-4 h-4"
                />
                <span>JSX/React</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-700 flex">
          <button
            onClick={() => setActiveTab('previews')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'previews' 
                ? 'bg-gray-700 border-b-2 border-blue-500 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            Preview Comparison
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'code' 
                ? 'bg-gray-700 border-b-2 border-blue-500 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            Code Editor
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'previews' ? (
            <>
              <div className="w-1/2 flex flex-col border-r border-gray-700">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg">
                  HTML Live Preview
                </div>
                <div className="flex-1 p-6 bg-white overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: inputCode }} />
                </div>
              </div>

              <div className="w-1/2 flex flex-col">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg">
                  Roblox Preview
                </div>
                <div className="flex-1 p-6 bg-white overflow-auto">
                  <RobloxPreview code={inputCode} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-1/2 flex flex-col border-r border-gray-700">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg flex justify-between items-center">
                  <span>{inputType === 'jsx' ? 'JSX/React' : 'HTML/CSS'} Input</span>
                  <span className="text-xs text-gray-400">Edit your code here</span>
                </div>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 p-4 bg-gray-900 text-green-400 font-mono text-base resize-none focus:outline-none leading-relaxed"
                  spellCheck="false"
                />
              </div>

              <div className="w-1/2 flex flex-col">
                <div className="bg-gray-800 p-3 border-b border-gray-700 font-semibold text-lg flex justify-between items-center">
                  <span>Roblox Lua Output</span>
                  <span className="text-xs text-gray-400">Copy & paste into Roblox Studio</span>
                </div>
                <pre className="flex-1 p-4 bg-gray-900 text-blue-400 font-mono text-base overflow-auto leading-relaxed">
                  {luaCode}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RobloxGuiConverter;