const fetch = require('node-fetch');
const username = "nhj12311";

// Delay between 2 votes is 12 hours
const delay = parseInt(43200);
// Amount required to get the minimum upvote (1%) is 20000000 VESTS ~ 2 Dolphins ~ 10 000 SP
const minVests = 20000000;
// Amount required to get 100% upvote is 4000000000000 VESTS ~ 2 000 Whales ~ 2 000 000 000 SP
const maxVests = 4000000000000;
// Don't upvote user beyond 10000000000000 VESTS
const limitVests = 10000000000000;
// Don't upvote more than 25%
const maxUpvote = 2500;

const calculateVotingPower = async (username) => {
  const url = `https://steemdb.com/api/accounts?account=`+username;
  let votingPower = 0;
  try {
    const [account] = await fetch(url).then(res => res.json());
    votingPower = account.followers_mvest >= minVests ? parseFloat(10000 / maxVests * account.followers_mvest) : 0;
    votingPower = votingPower > 10000 ? 10000 : parseFloat(votingPower);
    votingPower = (votingPower > 0 && votingPower < 6) ? 6 : parseInt(votingPower);
    if (maxUpvote) {
      votingPower = votingPower > maxUpvote ? maxUpvote : votingPower;
    }
    if (limitVests && account.followers_mvest >= limitVests) {
      votingPower = 0;
    }
  } catch (e) {
    console.log(e);
  }
  return votingPower;
};

const test = async() => {
  var vp = await calculateVotingPower("nhj12311");
  console.log("vp : "+vp);
}

test();
