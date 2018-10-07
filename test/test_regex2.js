var word = '[오늘은뿔난아무말일기]'
var tword = '[오늘은 뿔난 아무말 일기]N포 세대(3)'

console.log( getSeriesTitle(tword, word, ' ') );

function getSeriesTitle(org, trg, chr ){
  let _trgIdx = 0;
  let _orgIdx = 0;
  for( ; _orgIdx < org.length; _orgIdx++){
    if(org[_orgIdx] == chr ) continue;
    if( org[_orgIdx] != trg[_trgIdx++] ) {
      break;
    }
  }
  return org.substring(0, _orgIdx);
}
