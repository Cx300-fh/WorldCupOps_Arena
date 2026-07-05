const status=document.querySelector("#status");fetch("../fixtures/teams.json").then(r=>r.json()).then(teams=>{try{KnockoutPath.createBracket(teams)}catch(e){status.textContent=`等待实现：${e.message}`}});
