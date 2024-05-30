const express = require('express');
const axios = require('axios');


const PORT = 3000;
const SECRET_KEY = 'supersecret';
const SHOPIFY_SUBDOMAIN = 'envoy-dev-store';
const SHOPIFY_ACCESS_TOKEN = '';

express()
    .get('/', (req, res) => res.send('Hello, World.'))
    .get('/ping', (req, res) => res.send('pong'))
    .get('/orders/:orderId/products', authHandler, async (req, res) => {
        const response = await axios.get(`https://${SHOPIFY_SUBDOMAIN}.myshopify.com/admin/api/2024-04/orders/${req.params.orderId}.json`, {
            headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
        });

        const products = await Promise.all(response.data.order.line_items.map(async item => ({
            productId: item.product_id,
            name: item.name,
            productImageUrl: await getProductImageUrl(item.product_id),
        })));



        res.json({ products, singleProduct: products.length === 1 });

    })
    .get('/orders', authHandler, async (req, res) => {
        const orders = [];
        const email = req.query.email;
        const response = await axios.get(`https://${SHOPIFY_SUBDOMAIN}.myshopify.com/admin/api/2024-04/orders.json`, {
            headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
            params: { email: email }
        });

        for (const order of response.data.orders) {
            orders.push({
                firstProductId: order.line_items[0].product_id,
                orderStatusUrl: order.order_status_url,
                orderNumber: order.order_number,
                price: order.total_price,
                orderId: order.id,
                productImageUrl: await getProductImageUrl(order.line_items[0].product_id)
            });
        }

        res.json({ orders, length: orders.length });
    })
    .listen(PORT, () => console.log('Listening on port', PORT));


function authHandler(req, res, next) {
    const xApiKey = req.headers['x-api-key'];
    if (xApiKey !== SECRET_KEY) {
        res.status(401).json({ message: 'unauthorized' });
        return;
    }

    next();
}

async function getProductImageUrl(productId) {
    const response = await axios(`https://${SHOPIFY_SUBDOMAIN}.myshopify.com/admin/api/2024-04/products/${productId}/images.json`, {
        headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN }
    });

    return response.data.images[0].src;
}
