const $ = id => document.getElementById(id);
let lastResult = null;
let lastData = null;
let currentTab = 'customer';

function readData() {
  return {
    ticketId: $('ticketId').value.trim() || 'xxxx',
    playerId: $('playerId').value.trim() || 'xxx',
    complaintType: $('complaintType').value,
    accountStatus: $('accountStatus').value,
    askedGift: $('askedGift').checked,
    legalThreat: $('legalThreat').checked,
    totalPurchase: Number($('totalPurchase').value) || 0,
    totalRedemption: Number($('totalRedemption').value) || 0,
    pendingRedemption: Number($('pendingRedemption').value) || 0,
    currentPlayed: Number($('currentPlayed').value) || 0,
    currentUnplayed: Number($('currentUnplayed').value) || 0,
    purchases: [Number($('highestRecentPurchase').value) || 0],
    emotion: Number($('emotion').value),
    lastGiftAt: $('lastGiftAt').value,
    monthGiftCount: Number($('monthGiftCount').value) || 0,
    summary: $('summary').value.trim() || 'Player questioned game fairness / RNG outcomes.',
    offerStatus: $('offerStatus').value
  };
}

function frequencyText(r, d) {
  return `${r.within7 ? '1 gift within the past 7 days' : '0 gifts in the past 7 days'} / ${d.monthGiftCount} gift${d.monthGiftCount === 1 ? '' : 's'} this month`;
}

function templates(r, d) {
  const f = GiftCore.fmt;
  const amount = f(r.gift);
  const level = r.tier.level.replace(' / 10', '');
  const frequency = frequencyText(r, d);
  const net = `${f(d.totalPurchase)} - ${f(d.totalRedemption)} - ${f(d.pendingRedemption)} - ${f(d.currentPlayed)} - ${f(d.currentUnplayed)} = ${f(r.net)}`;
  const acknowledgement = GiftCore.personalizedAcknowledgement(d.summary, r.emotion, d.legalThreat);
  let customer = '';

  if (r.code === 'deny') {
    customer = r.tier.group === 'basic' && r.net <= 0
      ? 'Please use the approved Integrity Rejection Script from the KB.'
      : r.tier.group === 'unpaid' || (r.emotion === 0 && !d.askedGift)
        ? 'Please use the Old Integrity Script from the KB.'
        : r.text;
  } else if (r.code === 'offer') {
    customer = `${acknowledgement} Thank you for your patience while I reviewed your account. While all game outcomes are completely random and powered by a certified RNG, we truly value having you with us. After checking what I can offer on my end, I’d love to send you a complimentary gift of ${amount} SC to add a little extra fun to your next session. Would you be happy with this amount?`;
  } else if (r.code === 'direct') {
    customer = r.tier.group === 'basic'
      ? `${acknowledgement} While all game outcomes are completely random and powered by a certified RNG, we’d love to brighten your day a bit. I’ve gone ahead and applied a complimentary gift of ${amount} SC to your account as a thank-you for playing with us. Best of luck on your next spins!`
      : `${acknowledgement} Thank you for your confirmation! I’ve gone ahead and applied a complimentary gift of ${amount} SC to your account as a token of our appreciation. I hope it adds a little extra enjoyment to your next session.`;
  } else if (r.code === 'project' || (r.code === 't2' && d.offerStatus === 'round2')) {
    customer = `${acknowledgement} Let me submit a special request to our senior team to see if an exception can be made for a higher gift. This review typically takes 1 business day, and I will follow up with you right away once I have an update.`;
  } else {
    customer = d.legalThreat
      ? 'Use the approved holding response and escalate to T2 immediately. Do not promise or issue SC directly.'
      : `${acknowledgement} Thank you for confirming the offer. I’ve submitted your complimentary gift request of ${amount} SC to our senior team for processing, and I’ll let you know as soon as it has been sent to your account. Thank you for your patience and support!`;
  }

  const note = `Ticket ID: ${d.ticketId}\nPlayer ID: ${d.playerId}\nReason: ${d.summary}\nFairness Gift: ${level} | Net Loss Calculation: ${net} | Emotion Level ${r.emotion} (+${r.bonus} SC) | Gift Frequency Check: ${frequency}\nCalculation: Highest purchase among latest 5 ${f(r.highest)} × 10% = ${f(r.rawBase)} SC → Base Gift ${f(r.base)} SC + Emotion Bonus ${r.bonus} SC = ${f(r.calculated)} SC${r.current !== r.calculated ? ` → Current Offer ${f(r.current)} SC` : ''}\nAction: ${r.title}`;
  const side = `To: T2\nSubject: Fairness Gift\n\n1. Paid Level: ${level}\n2. Net Loss Calculation: ${net}\n3. Emotion Level & Summary: Level ${r.emotion} (+${r.bonus} SC) - ${d.summary}${d.legalThreat ? ' [LEGAL THREAT]' : ''}\n4. Gift Frequency Check: ${frequency}\n5. Calculated / Current Gift: ${f(r.calculated)} SC${r.current !== r.calculated ? ` / ${f(r.current)} SC` : ''}\n6. Escalation Reason: ${r.title}`;
  const message = {
    reason: `Fairness Gift: ${level} Net Loss Calculation ${net} Emotion Level ${r.emotion} (+${r.bonus} SC) Gift Frequency Check: ${frequency}`,
    title: 'A Token of Our Appreciation',
    content: 'Dear Player, Thank you for your continued love and support for our game! As a small token of our appreciation, we have sent a free gift directly to your game account. Please claim it at your convenience and enjoy the game!'
  };
  return { customer, note, side, message };
}

function render() {
  const d = readData();
  const r = GiftCore.calculate(d);
  lastData = d;
  lastResult = r;
  $('paidLevel').textContent = r.tier.level;
  $('netLoss').textContent = `${GiftCore.fmt(r.net)} SC`;
  $('baseGift').textContent = `${GiftCore.fmt(r.base)} SC`;
  $('emotionBonus').textContent = `+${r.bonus} SC`;
  $('giftAmount').textContent = GiftCore.fmt(r.gift);
  $('decisionTitle').textContent = r.title;
  $('decisionText').textContent = r.text;
  $('routeTitle').textContent = r.route.title;
  $('routeText').textContent = r.route.text;
  $('routeCard').className = `route-card ${r.route.type}`;
  $('amountLabel').textContent = r.code === 'deny' ? 'Eligible Amount' : r.code === 'offer' ? 'Current Offer' : 'Current Gift';
  $('decisionCard').className = `decision-card ${r.code === 'deny' || r.code === 'project' ? 'danger' : r.code === 't2' ? 'warning' : ''}`;
  $('warnings').innerHTML = r.warnings.map(w => `<div class="warning-item ${w.type}">${w.text}</div>`).join('');
  $('results').classList.remove('hidden');
  showTab(currentTab);
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showTab(name) {
  currentTab = name;
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
  if (!lastResult) return;
  const output = templates(lastResult, lastData);
  const isMessage = name === 'message';
  $('standardTemplate').classList.toggle('hidden', isMessage);
  $('messageTemplate').classList.toggle('hidden', !isMessage);
  if (isMessage) {
    $('messageReason').textContent = output.message.reason;
    $('messageTitle').textContent = output.message.title;
    $('messageContent').textContent = output.message.content;
  } else {
    $('templateText').textContent = output[name];
  }
}

async function copyElementText(elementId, button) {
  try {
    await navigator.clipboard.writeText($(elementId).textContent);
    const original = button.textContent;
    button.textContent = 'Copied ✓';
    setTimeout(() => { button.textContent = original; }, 1400);
  } catch {
    button.textContent = 'Copy Failed';
  }
}

$('giftForm').addEventListener('submit', event => { event.preventDefault(); render(); });
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
$('legalThreat').addEventListener('change', event => {
  if (event.target.checked) {
    $('emotion').value = '3';
    $('emotion').disabled = true;
  } else {
    $('emotion').disabled = false;
  }
});
$('copyBtn').addEventListener('click', event => copyElementText('templateText', event.currentTarget));
document.querySelectorAll('.field-copy').forEach(button => button.addEventListener('click', event => copyElementText(button.dataset.copy, event.currentTarget)));
