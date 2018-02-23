function get_base_symbol(tradeSymbol, basePairs) {
  for (let i=0, len=basePairs.length; i < len; i++) {
    if (tradeSymbol.split(basePairs[i])[1] === '') {
      return basePairs[i];
    }
  }
  return '';
}


module.exports = {
  get_base_symbol: get_base_symbol,
};