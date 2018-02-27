echo '★★★★★★★★★★ Node & Steem update start. ★★★★★★★★★★'
cd /app/steem_nhj
git stash
git pull
forever stop app.js
forever start app.js
echo '★★★★★★★★★★ Node & Steem update complete. ★★★★★★★★★★'
