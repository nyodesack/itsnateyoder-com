(function () {
  async function postLead(payload, webhookUrl) {
    if (!webhookUrl) {
      return { ok: false, error: 'Missing webhook URL' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors'
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      try {
        data = await response.text();
      } catch (_) {
        data = null;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  }

  function triggerDownload(downloadUrl, fallbackUrl) {
    const url = downloadUrl || fallbackUrl;
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleLeadMagnetSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const container = form.closest('[data-lead-magnet]') || document;
    const nameInput = form.querySelector('input[name="name"], input#name');
    const emailInput = form.querySelector('input[name="email"], input#email');
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');

    const name = (nameInput?.value || '').trim();
    const email = (emailInput?.value || '').trim();
    const webhookUrl = form.dataset.webhookUrl || window.LEAD_WEBHOOK_URL || '';
    const fallbackDownloadUrl = form.dataset.downloadUrl || '';
    const leadMagnet = form.dataset.leadMagnet || document.body.dataset.leadMagnet || document.title || 'Lead Magnet';
    const sourcePage = window.location.href;

    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    const originalButtonText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }

    const payload = {
      name,
      email,
      leadMagnet,
      source: 'website',
      sourcePage,
      tags: ['Website Lead', 'Lead Magnet', leadMagnet]
    };

    let leadResult;
    try {
      leadResult = await postLead(payload, webhookUrl);
    } catch (error) {
      console.error('Lead submission failed:', error);
      leadResult = { ok: false, error: error?.message || 'Unknown error' };
    }

    if (leadResult.ok) {
      const formWrap = container.querySelector('#downloadForm');
      const successWrap = container.querySelector('#successMessage');
      if (formWrap) formWrap.style.display = 'none';
      if (successWrap) successWrap.style.display = 'block';

      const workerDownloadUrl = leadResult?.data?.downloadUrl || '';
      triggerDownload(workerDownloadUrl, fallbackDownloadUrl);
    } else {
      console.error('Lead save failed:', leadResult);
      alert('We hit a problem saving your info. Please try again in a moment.');
    }

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }

  window.handleLeadMagnetSubmit = handleLeadMagnetSubmit;
  window.handleSubmit = handleLeadMagnetSubmit;
})();
