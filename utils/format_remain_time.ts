const formatRemainTime = (time: number) => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let formatString = '';
  let remainTime = time;

  if (remainTime / day > 0) {
    formatString += `${Math.floor(remainTime / day)}天 `;
    remainTime = remainTime % day;
  }

  if (remainTime / hour > 0) {
    formatString += `${Math.floor(remainTime / hour)}小時 `;
    remainTime = remainTime % hour;
  }

  if (remainTime / minute > 0) {
    formatString += `${Math.floor(remainTime / minute)}分`;
    remainTime = remainTime % minute;
  }

  return formatString;
};

export default formatRemainTime;
