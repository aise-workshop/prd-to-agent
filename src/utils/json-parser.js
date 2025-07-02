/**
 * 通用的 JSON 解析工具
 * 处理 LLM 响应中可能包含的 markdown 代码块和额外文本
 */

/**
 * 清理并解析 LLM 返回的 JSON 响应
 */
function parseCleanJSON(text, fallback = null) {
  try {
    // 清理文本
    let cleanText = text.trim();
    
    // 移除 markdown 代码块标记
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```[\s\S]*$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```[\s\S]*$/, '');
    }
    
    // 尝试提取 JSON 对象
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }
    
    // 解析 JSON
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('JSON parsing failed:', error.message);
    console.error('Raw text:', text);
    
    if (fallback !== null) {
      console.warn('Using fallback value');
      return fallback;
    }
    
    throw error;
  }
}

/**
 * 安全的 JSON 解析，带有默认值
 */
function safeParseJSON(text, defaultValue = {}) {
  try {
    return parseCleanJSON(text);
  } catch (error) {
    console.warn('JSON parsing failed, using default value:', error.message);
    return defaultValue;
  }
}

module.exports = {
  parseCleanJSON,
  safeParseJSON
};
