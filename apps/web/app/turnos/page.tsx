// ... (código igual al que ya tienes)
      // 1) Crear pago (mock)
      const createPay = await fetch('/api/payments/create', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ provider:'mock', amount: estimate.deposit })
      })
      const cp = await createPay.json().catch(async()=>({ ok:false, error: await createPay.text() }))
      if(!createPay.ok || !cp.ok) throw new Error(cp.error || 'Fallo creando pago')
      const { payment_id } = cp
      setInfoMsg('Confirmando pago (mock)…')

      // 2) Confirmar pago (mock)
      const confirm = await fetch('/api/payments/confirm', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ provider:'mock', payment_id, amount: estimate.deposit })
      })
      const cf = await confirm.json().catch(async()=>({ ok:false, error: await confirm.text() }))
      if(!confirm.ok || !cf.ok) throw new Error(cf.error || 'Fallo confirmando pago')

      // 3) Crear turno (requiere paid)
      setInfoMsg('Asignando número…')
      const res = await fetch('/api/turns/create',{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          payment_status: 'paid',
          payment_id,
          customer_name: form.customer_name,
          email: form.email,
          phone: form.phone,
          service: form.service,
          hand_or_feet: form.hand_or_feet,
          length: form.length,
          shape: form.shape,
          color: form.color,
          nail_art_level: form.nail_art_level,
          nail_art_count: form.nail_art_count,
          extras: form.extras,
          image_url,
          image_meta,
          price_estimated: estimate.total,
          deposit: estimate.deposit,
          image_score: estimate.image_score
        })
      })
      const jr = await res.json().catch(async()=>({ ok:false, error: await res.text() }))
      if(!res.ok || !jr.ok) throw new Error(jr.error || 'Fallo creando turno')
      router.push(`/review/${jr.public_id}`)
// ...
