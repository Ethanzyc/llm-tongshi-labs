/**
 * 将 CSV 表格的一行文本按逗号拆分成数组。
 * 支持带双引号的字段（引号内的逗号不会被拆分），
 * 也支持字段内出现双引号（通过两个双引号转义）。
 * 
 * @param {string} line - CSV 的一行文本。
 * @returns {string[]} 拆分后的字段数组。
 */
function parseCSVLine(line) {
  // 如果输入不是字符串，返回空数组
  if (typeof line !== 'string') {
    return [];
  }

  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      // 在引号内部
      if (char === '"') {
        // 检查下一个字符是否也是双引号（转义的双引号）
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'; // 添加一个双引号
          i++; // 跳过下一个双引号
        } else {
          inQuotes = false; // 引号结束
        }
      } else {
        current += char;
      }
    } else {
      // 不在引号内部
      if (char === '"') {
        inQuotes = true; // 引号开始
      } else if (char === ',') {
        // 遇到逗号，结束当前字段
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  // 添加最后一个字段
  result.push(current);

  return result;
}

// 测试示例
console.log(parseCSVLine('a,b,c')); // ["a", "b", "c"]
console.log(parseCSVLine('a,"b,c",d')); // ["a", "b,c", "d"]
console.log(parseCSVLine('"a""b",c')); // ['a"b', 'c']
console.log(parseCSVLine('a,,c')); // ["a", "", "c"]
console.log(parseCSVLine('')); // [""]
