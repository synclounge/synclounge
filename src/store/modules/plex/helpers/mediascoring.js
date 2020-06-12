import stringSimilarity from 'string-similarity';

// Higher is closer
const scoreMedia = (result, hostTimeline) => {
  const titleScore = stringSimilarity.compareTwoStrings(hostTimeline.rawTitle, result.title);
  // TODO: send parent title and score with it

  const parentTitleScore = (hostTimeline.parentTitle && result.parentTitle)
    ? stringSimilarity.compareTwoStrings(hostTimeline.parentTitle, result.parentTitle)
    : 0;

  const grandparentTitleScore = (hostTimeline.grandparentTitle && result.grandparentTitle)
    ? stringSimilarity.compareTwoStrings(hostTimeline.grandparentTitle, result.grandparentTitle)
    : 0;

  const typeScore = hostTimeline.type === result.type ? 1 : 0;

  return titleScore + parentTitleScore + grandparentTitleScore + typeScore;
};

export default scoreMedia;
