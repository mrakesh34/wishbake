export function renderMinimalTermsSection(prefix = 'wb') {
  return `
    <section class="wb-terms" aria-labelledby="${prefix}-terms-title">
      <div class="wb-terms__inner">
        <div class="wb-terms__head">
          <p class="wb-eyebrow">Terms &amp; Policies</p>
          <h2 id="${prefix}-terms-title">Terms &amp; Conditions</h2>
          <p>WISHBAKE Bakery &amp; Cake Studio · Bhubaneswar, Odisha · Support: <a href="mailto:djdahibara@gmail.com">djdahibara@gmail.com</a></p>
        </div>
        <div class="wb-terms__grid">
          <article class="wb-terms__item">
            <h3>Pricing &amp; Payments</h3>
            <p>All prices are listed in Indian Rupees (INR / ₹). Online payments are structured for UPI, cards, and netbanking via our secure payment gateway alongside Cash on Delivery for eligible Bhubaneswar orders.</p>
          </article>
          <article class="wb-terms__item">
            <h3>Order Confirmation &amp; Variations</h3>
            <p>Every cake is baked fresh to order. Colours, piping textures, and botanical garnishes are finished by hand and may show subtle artisanal variations from 3D digital previews.</p>
          </article>
          <article class="wb-terms__item">
            <h3>Delivery &amp; Cancellation</h3>
            <p>Chilled hand delivery operates within serviceable Bhubaneswar PIN codes. Cancellations or schedule changes must be requested at least 24 hours before the selected delivery slot.</p>
          </article>
          <article class="wb-terms__item">
            <h3>Refunds &amp; Quality Care</h3>
            <p>Because custom cakes are perishable made-to-order goods, approved refunds for eligible cancellations or verified transit damage are processed to the original payment method within 5–7 business days.</p>
          </article>
        </div>
      </div>
    </section>
  `;
}
