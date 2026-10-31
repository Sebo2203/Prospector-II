
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-WDRH4STDM1');

  function trackEvent(name, params){
    try{
      if(typeof gtag === 'function'){
        gtag('event', name, params || {});
      }
    }catch(_err){}
  }
