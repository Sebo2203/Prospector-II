
function showFeedbackError(text){
  const error = document.getElementById('feedback-error');
  error.textContent = text;
  error.style.display = 'block';
  document.getElementById('feedback-success').style.display = 'none';
}

function openFeedback(){
  const ov = document.getElementById('feedback-overlay');
  ov.style.display = 'flex';
  document.getElementById('feedback-success').style.display = 'none';
  const error = document.getElementById('feedback-error');
  error.textContent = 'Something went wrong. Try again.';
  error.style.display = 'none';
  document.getElementById('feedback-msg').value = '';
  document.getElementById('feedback-email').value = '';
  const btn = document.getElementById('feedback-submit');
  btn.disabled = false;
  btn.textContent = 'Send';
  setTimeout(()=>document.getElementById('feedback-email').focus(), 50);
}

function closeFeedback(){
  document.getElementById('feedback-overlay').style.display = 'none';
}

function isValidReplyEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitFeedback(){
  const msg = document.getElementById('feedback-msg').value.trim();
  const email = document.getElementById('feedback-email').value.trim();
  if(!email || !isValidReplyEmail(email)){
    showFeedbackError('Please enter a reply email address before sending.');
    document.getElementById('feedback-email').focus();
    return;
  }
  if(!msg){
    showFeedbackError('Please enter a message before sending.');
    document.getElementById('feedback-msg').focus();
    return;
  }

  const btn = document.getElementById('feedback-submit');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  try {
    const res = await fetch('https://formspree.io/f/xlgabyrl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, message: msg }),
    });
    if(!res.ok) throw new Error('bad response');
    document.getElementById('feedback-success').style.display = 'block';
    document.getElementById('feedback-error').style.display = 'none';
    btn.textContent = 'Sent!';
    setTimeout(closeFeedback, 2000);
  } catch(err){
    showFeedbackError('Something went wrong. Try again.');
    btn.disabled = false;
    btn.textContent = 'Send';
  }
}

document.getElementById('feedback-overlay').addEventListener('click', e => {
  if(e.target === document.getElementById('feedback-overlay')) closeFeedback();
});

document.addEventListener('keydown', e => {
  if(e.key==='Escape' && document.getElementById('feedback-overlay').style.display==='flex'){
    closeFeedback();
    e.stopPropagation();
  }
}, true);

