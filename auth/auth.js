/* VexoTrade auth — shared front-end behaviour.
   Real authentication, email delivery and 2FA need a backend (see VX.auth below).
   Everything here runs in the browser: validation, password toggle, strength meter,
   loading states and page transitions. */
(function(){
  var VX = window.VX = window.VX || {};

  /* ---------- backend hook (replace these stubs when the API exists) ---------- */
  VX.auth = {
    signIn: function(email, password){
      return new Promise(function(resolve){
        setTimeout(function(){ resolve({ok:true, redirect:'../index.html#dashboard'}); }, 900);
      });
    },
    signUp: function(data){
      return new Promise(function(resolve){
        setTimeout(function(){ resolve({ok:true, redirect:'login.html?registered=1'}); }, 900);
      });
    },
    requestReset: function(email){
      return new Promise(function(resolve){
        setTimeout(function(){ resolve({ok:true}); }, 900);
      });
    },
    signInWithGoogle: function(){
      return new Promise(function(resolve){
        setTimeout(function(){ resolve({ok:false, message:'Google sign-in will be available once the backend is connected.'}); }, 500);
      });
    }
  };

  /* ---------- helpers ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function $(s, root){ return (root||document).querySelector(s); }
  function $$(s, root){ return Array.prototype.slice.call((root||document).querySelectorAll(s)); }

  function setField(field, valid, msg){
    var input = $('.input', field);
    var err = $('.err', field);
    field.classList.toggle('invalid', !valid);
    if(input) input.classList.toggle('is-invalid', !valid);
    if(err && msg) err.textContent = msg;
    if(input) input.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  function showAlert(el, type, msg){
    el.className = 'alert show ' + type;
    el.textContent = msg;
  }
  function hideAlert(el){ el.className = 'alert'; el.textContent = ''; }

  function setLoading(btn, on){
    btn.classList.toggle('loading', on);
    btn.disabled = on;
  }

  /* password show / hide */
  $$('[data-toggle-pass]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var input = document.getElementById(btn.getAttribute('data-toggle-pass'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.setAttribute('aria-pressed', String(show));
    });
  });

  /* password strength */
  function strength(pw){
    var score = 0;
    if(pw.length >= 8) score++;
    if(pw.length >= 12) score++;
    if(/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if(/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
  }
  var LABELS = ['Too weak','Weak','Good','Strong'];
  $$('[data-strength]').forEach(function(input){
    var meter = document.getElementById(input.getAttribute('data-strength'));
    var label = meter && meter.nextElementSibling;
    input.addEventListener('input', function(){
      var s = input.value ? Math.max(1, strength(input.value)) : 0;
      meter.className = 'meter' + (s ? ' s' + s : '');
      if(label) label.textContent = s ? 'Password strength: ' + LABELS[s-1] : '';
    });
  });

  /* ---------- LOGIN ---------- */
  var loginForm = document.getElementById('loginForm');
  if(loginForm){
    var alertBox = document.getElementById('alert');
    var params = new URLSearchParams(location.search);
    if(params.get('registered')) showAlert(alertBox, 'ok', 'Account created. Sign in to continue.');
    if(params.get('reset')) showAlert(alertBox, 'ok', 'Password updated. Sign in with your new password.');

    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      hideAlert(alertBox);
      var email = loginForm.email, pass = loginForm.password;
      var ok1 = setField(email.closest('.field'), EMAIL.test(email.value.trim()), 'Enter a valid email address.');
      var ok2 = setField(pass.closest('.field'), pass.value.length >= 8, 'Password must be at least 8 characters.');
      if(!ok1 || !ok2){ (ok1 ? pass : email).focus(); return; }

      var btn = document.getElementById('signinBtn');
      setLoading(btn, true);
      VX.auth.signIn(email.value.trim(), pass.value).then(function(res){
        setLoading(btn, false);
        if(res.ok){ location.href = res.redirect; }
        else showAlert(alertBox, 'error', res.message || 'Incorrect email or password.');
      });
    });

    document.getElementById('googleBtn').addEventListener('click', function(){
      hideAlert(alertBox);
      VX.auth.signInWithGoogle().then(function(res){
        if(!res.ok) showAlert(alertBox, 'error', res.message);
      });
    });
    $$('[data-clear]').forEach(function(i){
      i.addEventListener('input', function(){ setField(i.closest('.field'), true); });
    });
  }

  /* ---------- SIGN UP ---------- */
  var signupForm = document.getElementById('signupForm');
  if(signupForm){
    var alertS = document.getElementById('alert');
    signupForm.addEventListener('submit', function(e){
      e.preventDefault();
      hideAlert(alertS);
      var f = signupForm;
      var checks = [
        setField(f.fullname.closest('.field'), f.fullname.value.trim().length >= 3, 'Enter your full name.'),
        setField(f.email.closest('.field'), EMAIL.test(f.email.value.trim()), 'Enter a valid email address.'),
        setField(f.country.closest('.field'), f.country.value !== '', 'Select your country.'),
        setField(f.password.closest('.field'), f.password.value.length >= 8, 'Password must be at least 8 characters.'),
        setField(f.confirm.closest('.field'), f.confirm.value === f.password.value && f.confirm.value !== '', 'Passwords do not match.'),
      ];
      var termsOk = f.terms.checked;
      document.getElementById('termsErr').style.display = termsOk ? 'none' : 'block';
      if(checks.indexOf(false) !== -1 || !termsOk){
        var firstBad = $$('.field.invalid', f)[0];
        if(firstBad) $('.input', firstBad).focus();
        return;
      }
      var btn = document.getElementById('signupBtn');
      setLoading(btn, true);
      VX.auth.signUp({
        name: f.fullname.value.trim(), email: f.email.value.trim(),
        country: f.country.value, password: f.password.value,
        newsletter: f.newsletter.checked
      }).then(function(res){
        setLoading(btn, false);
        if(res.ok) location.href = res.redirect;
        else showAlert(alertS, 'error', res.message || 'Could not create the account. Try again.');
      });
    });
    document.getElementById('googleBtn').addEventListener('click', function(){
      VX.auth.signInWithGoogle().then(function(res){
        if(!res.ok) showAlert(alertS, 'error', res.message);
      });
    });
    $$('[data-clear]').forEach(function(i){
      i.addEventListener('input', function(){ setField(i.closest('.field'), true); });
    });
    document.getElementById('terms').addEventListener('change', function(){
      document.getElementById('termsErr').style.display = 'none';
    });
  }

  /* ---------- FORGOT PASSWORD ---------- */
  var resetForm = document.getElementById('resetForm');
  if(resetForm){
    var alertR = document.getElementById('alert');
    resetForm.addEventListener('submit', function(e){
      e.preventDefault();
      hideAlert(alertR);
      var email = resetForm.email;
      if(!setField(email.closest('.field'), EMAIL.test(email.value.trim()), 'Enter a valid email address.')){
        email.focus(); return;
      }
      var btn = document.getElementById('resetBtn');
      setLoading(btn, true);
      VX.auth.requestReset(email.value.trim()).then(function(res){
        setLoading(btn, false);
        if(res.ok){
          document.getElementById('resetView').classList.add('hidden');
          document.getElementById('sentView').classList.remove('hidden');
          document.getElementById('sentTo').textContent = email.value.trim();
        } else showAlert(alertR, 'error', res.message || 'Could not send the email. Try again.');
      });
    });
    document.getElementById('resendBtn').addEventListener('click', function(){
      var btn = this;
      btn.disabled = true; btn.textContent = 'Sent again';
      setTimeout(function(){ btn.disabled = false; btn.textContent = 'Resend email'; }, 30000);
    });
    $$('[data-clear]').forEach(function(i){
      i.addEventListener('input', function(){ setField(i.closest('.field'), true); });
    });
  }
})();
