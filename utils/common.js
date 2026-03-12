/**
 * @name 格式化数值（返回数字类型）
 * @description 将输入值格式化为指定小数位数的数字，支持不同的舍入模式
 * @param value - 要格式化的值（支持数字、字符串、null、undefined）
 * @param decimals - 保留小数位数，默认2位
 * @param rounding - 舍入模式：round（四舍五入，默认）、floor（向下取整）、ceil（向上取整）
 * @returns 格式化后的数字，如果输入无效则返回0
 * @example formatNumber(1234567.891) // 1234567.89
 * @example formatNumber(1234567.895) // 1234567.90
 * @example formatNumber(null) // 0
 * @example formatNumber('abc') // 0
 * @example formatNumber(1234567.891, 0) // 1234568
 * @example formatNumber(1234567.891, 4) // 1234567.8910
 * @example formatNumber(123.456, 2, 'floor') // 123.45（向下取整）
 * @example formatNumber(123.451, 2, 'ceil') // 123.46（向上取整）
 */
export const formatNumber = (value, decimals = 2, rounding = "round") => {
  // 处理空值
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  // 转换为数字
  const num = Number(value);
  // 处理非数字值
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  
  const factor = Math.pow(10, decimals);

  // 根据舍入模式处理
  switch (rounding) {
    case "floor": // 向下取整（截断）
      return Math.floor(num * factor) / factor;
    case "ceil": // 向上取整
      return Math.ceil(num * factor) / factor;
    case "round": // 四舍五入（默认）
    default:
      return Math.round(num * factor) / factor;
  }
};
/**
 * @name 百分比格式化方法
 * @description 将小数比例值转换为百分比数值（如：0.8534 → 85.34）
 * @param {number|string} value - 需要格式化的小数比例值（0-1之间的小数，如：0.8534）
 * @param {number} [decimals=2] - 保留的小数位数，默认为2位
 * @returns {number} 返回格式化后的百分比数值（已乘以100）
 * 
 * @example
 * formatPercentage(0.8534)        // 85.34
 * formatPercentage(0.6234, 1)      // 62.3
 * formatPercentage(0.3845, 0)      // 38
 * formatPercentage(null)           // 0
 * formatPercentage(undefined)      // 0
 * formatPercentage('')             // 0
 * formatPercentage('abc')          // 0
 * formatPercentage(Infinity)       // 0
 * formatPercentage(1)              // 100
 * formatPercentage(0)              // 0
 * formatPercentage(1.5)            // 150
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  
  // 乘以100转换为百分比
  return formatNumber(num * 100, decimals);
}
