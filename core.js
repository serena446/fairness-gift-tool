(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GiftCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const emotionBonus={0:0,1:5,2:10,3:20};
  const money=n=>Math.round((Number(n)||0)*100)/100;
  const fmt=n=>Number.isInteger(money(n))?String(money(n)):money(n).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
  function personalizedAcknowledgement(summary,emotion,legalThreat){
    const text=String(summary||'').toLowerCase();
    if(legalThreat||/lawsuit|\bsue\b|lawyer|legal action|attorney/.test(text))return 'I understand the seriousness of your concern and how strongly you feel about your recent gameplay experience.';
    if(/quit|leav(e|ing)|close (my|the) account|deactivat|delet(e|ing) (my|the) account/.test(text))return 'I’m sorry that your recent gameplay experience has left you considering stepping away from the game.';
    if(/losing streak|keep losing|lost (a lot|so much)|no win|never win/.test(text)&&/rng|rtp|fair|rigged|random/.test(text))return 'I understand how discouraging a long losing streak can feel and why those results led you to question how the game outcomes are determined.';
    if(/losing streak|keep losing|lost (a lot|so much)|no win|never win/.test(text))return 'I understand how discouraging it can feel when a losing streak continues without the turnaround you hoped for.';
    if(/rng|rtp|fair|rigged|random|odds|win rate/.test(text))return 'I understand why the results from your recent sessions led you to question the fairness and randomness of the games.';
    if(/bonus|free play|free sc|gift/.test(text))return 'I understand that you were hoping for a little more playtime after the experience you described.';
    if(Number(emotion)>=2||/angry|furious|frustrat|upset|terrible|awful/.test(text))return 'I can see how upsetting and frustrating this recent gameplay experience has been for you.';
    return 'Thank you for explaining what happened. I understand why your recent gameplay experience was disappointing.';
  }
  function tierFor(total){total=money(total);if(total<=0)return{level:'Unpaid',group:'unpaid',min:0,max:0,step:0};if(total<=20)return{level:'Paid 1',group:'basic',min:2,max:50,step:0};if(total<=100)return{level:'Paid 2',group:'basic',min:2,max:50,step:0};if(total<=200)return{level:'Paid 3',group:'basic',min:2,max:50,step:0};if(total<=500)return{level:'Paid 4',group:'basic',min:2,max:50,step:0};if(total<=1100)return{level:'Paid 5',group:'mid',min:10,max:100,step:10};if(total<=3000)return{level:'Paid 6',group:'mid',min:10,max:100,step:10};if(total<=6000)return{level:'Paid 7',group:'mid',min:10,max:100,step:10};if(total<17000)return{level:'Paid 8',group:'mid',min:10,max:100,step:10};return{level:'Paid 9 / 10',group:'vip',min:50,max:200,step:20};}
  function calculate(d,nowValue){
    const now=nowValue?new Date(nowValue):new Date(),tier=tierFor(d.totalPurchase),legal=!!d.legalThreat;
    const emotion=legal?3:Number(d.emotion||0),bonus=emotionBonus[emotion];
    const currentBalance=('currentPlayed' in d||'currentUnplayed' in d)?money((d.currentPlayed||0)+(d.currentUnplayed||0)):money(d.currentBalance);
    const net=money(d.totalPurchase-d.totalRedemption-d.pendingRedemption-currentBalance);
    const highest=Math.max(0,...(d.purchases||[]).map(money));
    const rawBase=money(highest*.1);
    const base=tier.group==='unpaid'?0:money(Math.min(tier.max,Math.max(tier.min,rawBase)));
    const calculated=tier.group==='unpaid'?0:money(base+bonus);
    const status=d.offerStatus||'initial';
    const additions=status==='round1'?1:status==='round2'?2:0;
    const current=money(calculated+additions*tier.step);
    const last=d.lastGiftAt?new Date(d.lastGiftAt):null;
    const within7=last&&!Number.isNaN(last.valueOf())&&(now-last)<7*24*60*60*1000&&(now-last)>=0;
    const monthBlocked=Number(d.monthGiftCount||0)>=3;
    const warnings=[];
    let code='offer',title='Present the Offer and Await Confirmation',text='Use the suggested reply to present the current amount. Do not issue the gift until the player confirms.',gift=current;
    if(d.complaintType!=='integrity'){
      code='deny';title='Integrity Gift Does Not Apply';text=d.complaintType==='freeplay'&&d.accountStatus==='frozen'?'Account deletion is based only on Free Play. Follow the Free Play Response and Deactivation SOP.':'This is not a game fairness, RNG, or losing-streak complaint. Follow the applicable KB workflow.';gift=0;
    }else if(legal){
      code='t2';title='Legal Threat: Escalate to T2 Immediately';text='T1 must not issue the gift directly. Document the legal threat and frequency check, then set Need Reply to Yes.';
      warnings.push({type:'danger',text:'A legal threat is marked. Immediate T2 escalation is mandatory.'});
      if(within7||monthBlocked||tier.group==='unpaid'){gift=0;if(within7)warnings.push({type:'danger',text:'Fewer than exactly 7 days have passed since the last gift. Do not issue.'});if(monthBlocked)warnings.push({type:'danger',text:'The monthly limit of 3 gifts has been reached. Do not issue.'});if(tier.group==='unpaid')warnings.push({type:'danger',text:'Unpaid players are not eligible for Free SC.'});}
    }else if(tier.group==='unpaid'){
      code='deny';title='Do Not Issue Free SC';text='Use the Old Integrity Script for the unpaid player and close the ticket.';gift=0;
    }else if(emotion===0&&!d.askedGift){
      code='deny';title='Level 0 With No Gift Request: Do Not Issue';text='Use the Old Integrity Script and close the ticket.';gift=0;
    }else if(within7||monthBlocked){
      code='deny';title='Frequency Check Failed: Do Not Issue';text='Use the appropriate Integrity response. Never disclose the frequency limits to the player.';gift=0;
      if(within7)warnings.push({type:'danger',text:'Fewer than exactly 7 days have passed since the last gift.'});if(monthBlocked)warnings.push({type:'danger',text:'The monthly limit of 3 gifts has been reached.'});
    }else if(tier.group==='basic'&&net<=0){
      code='deny';title='Net Loss Is Not Positive: Decline the Gift';text='Paid 1–4 players are eligible only when Net Loss is greater than 0. Use the Integrity Rejection Script.';gift=0;
    }else if(calculated>tier.max){
      code='project';title='Above Tier Cap: Escalate to the Project Team via T2';text=`The calculated ${fmt(calculated)} SC exceeds the ${tier.max} SC cap for ${tier.level}. Project Team approval and issuance are required.`;
      warnings.push({type:'danger',text:'T1 ACTION REQUIRED: Do not issue this gift. Submit a Fairness Side Conversation to T2; T2 must escalate it to the Project Team for approval and issuance.'});
    }else if((tier.group==='mid'||tier.group==='vip')&&status==='round2'){
      code='t2';title='No Agreement After 2 Rounds: Escalate to T2';text='Stop negotiating and submit a Fairness Side Conversation. Set Need Reply to Yes.';
      warnings.push({type:'danger',text:'T1 ACTION REQUIRED: Stop negotiating and submit a Fairness Side Conversation to T2. Do not issue the gift directly.'});
    }else if((tier.group==='mid'||tier.group==='vip')&&current>tier.max){
      code='t2';title='Next Offer Would Exceed the Cap: Escalate to T2';text='Stop negotiating and submit a Fairness Side Conversation. Do not present an amount above the tier cap.';gift=money(current-tier.step);
      warnings.push({type:'danger',text:'T1 ACTION REQUIRED: Do not make an offer above the tier cap. Submit a Fairness Side Conversation to T2.'});
    }else if((tier.group==='mid'||tier.group==='vip')&&status!=='agreed'){
      code='offer';title=status==='round1'?'Present the Round 1 Increased Offer':'Present the Offer and Await Confirmation';text=`The current offer is ${fmt(current)} SC. Obtain the player's explicit confirmation before selecting the issuance path.`;
    }else if(current<=50){
      code='direct';title='T1 May Issue Directly';text='Issue the gift in the backend, send the required in-game message, and immediately submit the Google Form as T1.';
    }else if(current<=tier.max){
      code='t2';title='Player Confirmed: Send to T2 for Issuance';text='Submit a Fairness Side Conversation. T2 issues the gift and submits the Google Form. Set Need Reply to Yes.';
      warnings.push({type:'danger',text:`T1 ACTION REQUIRED: The confirmed ${fmt(current)} SC gift is above the 50 SC T1 issuance limit. Do not issue it directly; submit a Fairness Side Conversation to T2 for issuance.`});
    }else{
      code='project';title='Escalate to the Project Team via T2';text='The amount exceeds the Paid Tier cap. Project Team approval and issuance are required.';
    }
    if(code==='t2'&&status==='agreed'&&gift>50&&!warnings.some(w=>w.text.includes('50 SC T1 issuance limit'))){
      warnings.push({type:'danger',text:`T1 ACTION REQUIRED: The confirmed ${fmt(gift)} SC gift is above the 50 SC T1 issuance limit. Do not issue it directly; submit a Fairness Side Conversation to T2 for issuance.`});
    }
    if(d.accountStatus==='frozen'&&d.complaintType==='integrity'&&code!=='deny')warnings.push({type:'',text:'A-Del / Frozen integrity complaint: once confirmed or applicable, submit a task to unfreeze the account and issue the gift.'});
    if(rawBase>tier.max)warnings.push({type:'',text:`The original 10% base amount is ${fmt(rawBase)} SC. Base Gift has been limited to the ${tier.max} SC tier cap; the emotion bonus is added separately.`});
    let route;
    if(code==='deny'){
      route={type:'deny',title:'DO NOT ISSUE',text:'No backend issuance is allowed for this result. Follow the recommended response shown above.'};
    }else if(code==='project'){
      route={type:'project',title:'SUBMIT TO T2 → PROJECT TEAM',text:'T1 submits a Fairness Side Conversation to T2. T2 contacts the Project Team for approval and issuance.'};
    }else if(code==='t2'){
      route={type:'t2',title:'SUBMIT FAIRNESS TICKET TO T2',text:'T1 must not issue this gift. Submit a Fairness Side Conversation and set Need Reply to Yes; T2 handles issuance.'};
    }else if(code==='direct'){
      route={type:'direct',title:'T1 — ISSUE DIRECTLY',text:'T1 issues the gift in the backend, sends the in-game message, and immediately submits the Google Form.'};
    }else if(gift<=50){
      route={type:'direct',title:'IF ACCEPTED: T1 — ISSUE DIRECTLY',text:'First obtain the player’s confirmation. Once accepted, T1 may issue this amount directly and submit the Google Form.'};
    }else{
      route={type:'t2',title:'IF ACCEPTED: SUBMIT TICKET TO T2',text:'First obtain the player’s confirmation. Once accepted, T1 submits a Fairness Side Conversation; T2 issues the gift.'};
    }
    return{tier,emotion,bonus,currentBalance,net,highest,rawBase,base,calculated,current,gift,within7,monthBlocked,code,title,text,warnings,route};
  }
  return{calculate,tierFor,fmt,personalizedAcknowledgement};
});
