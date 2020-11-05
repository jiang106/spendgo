'use strict';

// ENV variables
const SPENDGO_ACCOUNT_ID       = '';
const SPENDGO_URL              = '';
const SPENDGO_API_KEY          = '';
const SPENDGO_API_SECRET       = '';
const SPENDGO_OAUTH_API_KEY    = '';
const SPENDGO_OAUTH_API_SECRET = '';
const SPENDGO_OAUTH_URL        = '';                                             // using in oauth
const SPENDGO_REDIRECT_URI     = '';                           // using in oauth2 procedure
// const SPENDGO_WEB_CONTEXT       = '?';
// const SPENDGO_MOBILE_API_KEY    = '?';
// const SPENDGO_MOBILE_API_SECRET = '?';

// third party node modules
const axios = require('axios');
const { createHmac } = require('crypto');
const querystring = require('querystring'); // for oauth TOKEN request

/**
 * Create HTTP Headers:
 * @apiPath: (STRING) uri for generate X-Class-Signature
 * @rawJson: (STRING - OPTIONAL) body for generate X-Class-Signature
 * 
 * return (STRING)
 */
function createHeaders(apiPath, rawJson='') {
  let apiKey = '';
  let secret = '';

  if(apiPath.startsWith('/loyalty/accounts')){
    apiKey = SPENDGO_API_KEY;
    secret = SPENDGO_API_SECRET;
  // } else if (apiPath.startsWith('/mobile/gen')) {
  //   apiKey = SPENDGO_MOBILE_API_KEY;
  //   secret = SPENDGO_MOBILE_API_SECRET;
  } else {
    console.log(`Error! Wrong API path name.`);
  }

  // decoded Shared Secret key from base64 to utf8
  let decodeSecret = Buffer.from(secret, 'base64').toString('utf8');

  // content(uri + body)
  let beforeEncodedBody = apiPath + rawJson;

  // generated signature using decoded shared secret key
  // example: hmac("sha256", (uri + body), Base64Decoded(base64_encoded_secret))
  let signature = createHmac('sha256', decodeSecret).update(beforeEncodedBody).digest('base64');
  
  let httpHeaders = {
    'X-Class-Key'      : apiKey,
    'X-Class-Signature': signature,
    'Content-Type'     : 'application/json'
  }

  return httpHeaders;
}

/**
 * HTTP request using axios
 * 
 * @ config: (OBJECT)
 * Example:
 * {
 *  method: 'post',
 *  url: SPENDGO_URL + path,
 *  headers: createHeaders(path, jsonData),
 *  data: jsonData
 * }
 * 
 * return a Promise
 */
async function axiosRequest(config) {
  try {
    let res = await axios(config);
    return {
      status: res.status,
      result: res.data
    }
  } catch (error) {
    return {
      status: error.response.status,
      result: error.response.data
    }
  }
}


module.exports = {
  // API key, Server-to-server
  serverCreateMember,
  serverRetrieveBalance,
  serverRetrieveRewardsByStore,
  orderCheckout,
  orderPlaced,
  orderBilled,
  orderVoided,
  orderCompleted,
  orderRefunded,
  // oauth2
  oauthExchangeForToken,
  oauthRetrieveMember,

  // -- need Mobile API key, for mobile endpoints
  // mobileRetrieveMemberStatus,  //api 2.1.1
  // mobileCreateMember,
  // mobileUpdateMember,
  // mobileRetrieveBalance,  //api 2.1.1
  // mobileSignIn,
  // mobileRefreshToken,  //api 2.1.1
  // mobileRetrieveMember,  //api 2.1.1
  // mobileSignOut,
  // mobileResetPassword,
  // mobileNearStores  //api 2.1.1
}

/**
 * Creates a new member associated to your account or retrieves the existing member 
 *
 * POST /loyalty/accounts
 * 
 * @phone: (STRING - REQUIRED) member’s phone number.
 * 
 * @optionalObject: (OBJECT - OPTIONAL)
 * {
 *   email: 'smithjoe@abcd.com',
 *   name: {
 *     last:'Smith',
 *     first:'Joe'
 *   },
*    password: 'Password123',
*    dob: '2000-01-01',
*    gender: 'm',
*    marital_status: 'married',
*    address: {
*     city: 'San Francisco', 
*     state: 'CA', 
*     street: '3rd Street', 
*     zip: '94107', 
*     country: 'US'
*    },
*    sms_opt_in: false, //member’s text subscription preference for your brand. Once the user has validated their account creation, they will be sent the text double opt-in flow to confirm their text subscription.
*    email_opt_in: false, //member’s email marketing preference for your brand.
*    verify_email: false
 * }
 * 
 * Success: return promise 
 * { status: 200, result: { id: '496630', status: 'Active' } } // id as spendgo_id
 * { status: 202, result: { status: 'WaitingEmailVerification' }} // if optionalObject "verify_email: true"
 * 
 * Errors:
 * { status: 400, result: { code: 2003, details: 'Invalid customer phone number' }}
 */
async function serverCreateMember(phone, optionalObject) {
  // Spendgo API path
  let path = '/loyalty/accounts';
  
  // create request data
  let jsonData = JSON.stringify({
    customer: {
      phone: phone,
      ...optionalObject
    }
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }

  // request data, return data
  return await axiosRequest(config);
}

/**
 * Retrieve member balance
 * 
 * Get the member’s points, visits, or stamps balance by spendgo member’s unique id.
 *
 * GET /loyalty/accounts/{spendgo_id}/balance
 *
 * REQUIRED params
 * @spendgo_id: (STRING - REQUIRED) member’s Spendgo unique identifier.
 * 
 * Success: return 
 * {
 *   status: 200,
 *   result: {
 *     quantity: 0,
 *     spend_threshold: 50,
 *     units: 'points',
 *     label: '$5 Off',
 *     rewards: []
 *   }
 * }
 * 
 * Errors:
 * { status: 400, result: { code: 4003, details: 'Invalid user account id: 0' }
}
 */
async function serverRetrieveBalance(spendgo_id) {
  // Spendgo API path
  var path = `/loyalty/accounts/${ spendgo_id }/balance`

  // create request config
  var config = {
    url: SPENDGO_URL + path,
    headers: createHeaders(path),
  }
console.log(config)
  // request data, return data
  return await axiosRequest(config);
}

/**
 * Retrieve member rewards by store
 * 
 * Get the member’s rewards that are available for redemption at a particular store.
 *
 * GET /loyalty/accounts/{spendgo_id}/rewards?store={store_code}
 *
 * REQUIRED params
 * @spendgo_id: (STRING - REQUIRED) member’s Spendgo unique identifier.
 * @store_code: (STRING - REQUIRED) member’s Spendgo unique identifier.
 * 
 * Success: return 
 * Example response (200):
 * { 
 *   "rewards": [
 *     { 
 *       "id": "2234402", // A unique identifier for the object. When prefaced with a “P_” this indicates a Shop With Points program.
 *       "currency": "USD",
 *       "offer": "rebate", //Discount type. Values are “rebate”, “discount” or “gift”.
 *       "label": "$5 Off", //Member facing reward name.
 *       "value": 5, // projected reward value.
 *       "reference": {  //Optional POS reference for processing the reward.
 *         "type": "promo",
 *          "code": "5OFF" //discount code linked to order processing.
 *       },
 *       "quantity": 1 //The number of rewards that can be used.
 *     } 
 *   ]
 * }
 * 
 * Errors:
 * { status: 400, result: { code: 4002, details: 'Invalid store id: None' }}
 */
async function serverRetrieveRewardsByStore(spendgo_id, store_code) {
  // Spendgo API path
  var path = `/loyalty/accounts/${spendgo_id}/rewards?store=${store_code}`;

  // create request config
  var config = {
    method: 'get',
    url: SPENDGO_URL + path,
    headers: createHeaders(path),
  }

  // request data, return data
  return await axiosRequest(config);
}



/**
 * ordering
 * 
 * Posts a member’s order at the various stages of their ordering workflow.
 * Each stage in the ordering workflow has a corresponding order status to be inserted in the request.
 *
 * POST loyalty/accounts/<SPENDGO_ID>/orders
 *
 * ALL params
 * @spendgo_id (STRING - REQUIRED) member’s Spendgo unique identifier.
 * @id: (string Optional) order id generated by the commerce system. Required at or after the “placed” order status.
 * @source (string Required) order source. Values are “web” for desktop, “mobileweb” for mobile web, “mobileapp” for mobile apps, or “instore” for in-store orders.
 * @transaction: (string Optional) when “refunded” status, this is an external reference sent from Spendgo at the “billed” or “completed” status.
 * @status (string Required) order status. Values are “checkout”, “placed”, “billed”, “completed”, “voided”, and “refunded”.
 * @ type: (string Optional) order type. Values are “regular” or “catering”.
 * @rendition: (string Optional) Values are “onsite”, “pickup”, or “delivery”.
 * @currency: (string Optional) three-letter ISO 4217 code.
 * @placed: (string Optional) date‐time formatted as YYYY-MM-DDTHH:MM:SSZ. This is when the order was created, but does not indicate when the order was paid or when the customer receives the order. For example the order is placed on 3/1/2020 @ 10am to be picked up on 3/3/2020 @ noon.
 * @wanted: (string Optional) date‐time formatted as YYYY-MM-DDTHH:MM:SSZ. This represents the time when the customer receives the order. For example, the order is placed on 3/1/2018 @ 10am to be picked up on 3/3/2018 @ noon.
 * @vendor (string Required) store code. =@store_code ,999999
 * @brand (string Required) brand’s unique Spendgo ACCOUNT_ID provided by Spendgo. =@SPENDGO_ACCOUNT_ID ,3***4
 * @subtotal (decimal Required) order subtotal — order cost before applying tax, tip, delivery, and discount.
 * @tax: (decimal Optional) order tax amount.
 * @tip: (decimal Optional) order tip amount.
 * @delivery: (decimal Optional) delivery cost.
 * @discount: (decimal Optional) discount amount. This is the sum of all discounts being applied to the cart.
 * @total (decimal Required) order total — the sum of subtotal, delivery, tip, tax, and discounts.
 * @address: (array Optional) customer’s delivery address.
 *    @street: (string Optional) street address.
 *    @cross: (string Optional) cross street. 
 *    @city: (string Optional) city. 
 *    @ code: (string Optional) zip code.
 *    @region: (string Optional) region (a two-letter ISO 3166-2 code). 
 *    @country: (string Optional) country (a three-letter ISO 3166-1 code).
 * @payments: (array Optional) payment tender(s). Required for subsequent order states after “checkout”.
 *    @tender: (string Optional) payment method. Values are “cash”, “check”, “credit”, “debit”, “prepaid”, “transfer”, or “value”. 
 *    @issuer: (string Optional) payment vendor. Values are “amex”, “diners”, “discover”, “jcb”, “mastercard”, “paypal”, or “visa”. 
 *    @suffix: (string Optional) payment last four digits. 
 *    @amount: (integer Optional) amount allocated to this payment method.
 * @basket (object Required) order details. 
 *    @uuid: (string Optional) ordering transaction identifier. 
 *    @rewards (array Optional required at redeem). Corresponds to the reward discounts on the order. 
 *        @provider (string Optional required at redeem). When redeeming a reward, the required value is “Spendgo”. 
 *        @id (string Optional required at redeem). When redeeming a reward, the required value is the corresponding id returned in the Retrieve member rewards by store request. 
 *        @level (string Optional required at redeem). When redeeming a reward, the value is “basket”. 
 *        @discount (decimal Optional required at redeem). This is required when redeeming a reward. When the order status is “checkout”, the value is the reward.value returned in the Retrieve member rewards by store request. The response will include the validated discount value — you will use the validated value in subsequent order calls.
 *        @product: (string Optional) product item SKU.
 *    @posEntries (array Required) order items. 
 *        @posItem (array Required) item details. 
 *            @label (string Required) item name. eg: "Turkey Sanwich"
 *            @cost (decimal Required) item unit cost value.
 *            @product: (string Optional) item product identifier. 
 *            @categories: (string Optional) item categories.
*         @quantity (integer Required) item quantity added to order.
 *            @modifiers: (array Optional) modifications or add-ons to an item.
 *                @product: (string Optional) modifier product identifier. 
 *                @modifiers: (array Optional) modifications or add-ons to a modifier. 
 *                @label: (string Optional) item modifier name. Required when a modifier is present. 
 *                @cost: (decimal Optional) item modifier cost value. Required when a modifier is present. 
 *                @categories: (array Optional) modifier categories. 
 *                @quantity: (integer Optional) quantity of modifier added to item. Required when a modifier is present.
 * 
 * Success: return 
 * Example response (200):
 * {
 *    "transaction": 
 *        {
 *            "id": "", // (String - Optional) order identifier created in status “billed” order.
 *            "discount": 5.00, 
 *            "status": "checkout", 
 *            "message": "" // (String - Optional) If there is an error applying a reward to the order in the checkout stage, this will contain a customer-facing error message.
 *        } 
 * }
 * Errors:
 */

/**
  * order status is checkout
  * 
  * required params
  * @spendgo_id
  * @store_code
  * @orderSource
  * @orderSubtotal 
  * @orderTotal 
  * @orderBasket
  *     @posEntries
  *         @posItem
  *             @label
  *             @cost
  *         @quantity
  * Example: JSON body
  * {
  *     "status"  : "checkout",
  *     "vendor"  : "999999",
  *     "brand"   : "33559",
  *     "source"  : "mobileweb",
  *     "subtotal": 100,
  *     "total"   : 120,
  *     "basket"  : {
  *         "posEntries":[{
  *               "posItem": {
  *                   "lable"   : "Turkey Sandwich",
  *                   "cost"    : 12.99,
  *               },
  *               "quantity": 2
  *         }]
  *     }
  * 
  * Success: return
  * {
  *     status: 200,
  *     result: { transaction: { status: 'checkout', discount: 0 } 
  * }
  */
async function orderCheckout(spendgo_id, store_code, orderSource, orderSubtotal, orderTotal, orderBasket) {
  // Spendgo API path
  var path = `/loyalty/accounts/${spendgo_id}/orders`;

  // create request data
  let jsonData = JSON.stringify({
    status: 'checkout',
    vendor: store_code,
    brand: SPENDGO_ACCOUNT_ID,
    source: orderSource,
    subtotal: orderSubtotal,
    total: orderTotal,
    basket: orderBasket
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }
  
  // request data, return data
  return await axiosRequest(config);
}

/**
 * order status is placed(same as "checkout")
 * 
 */
async function orderPlaced(spendgo_id, store_code, orderSource, orderSubtotal, orderTotal, orderBasket) {
 // Spendgo API path
 var path = `/loyalty/accounts/${spendgo_id}/orders`;

 // create request data
 let jsonData = JSON.stringify({
   status: 'placed',
   vendor: store_code,
   brand: SPENDGO_ACCOUNT_ID,
   source: orderSource,
   subtotal: orderSubtotal,
   total: orderTotal,
   basket: orderBasket
 });

 // create request config
 let config = {
   method: 'post',
   url: SPENDGO_URL + path,
   headers: createHeaders(path, jsonData),
   data: jsonData
 }
 
 // request data, return data
 return await axiosRequest(config);
}

/**
  * order status is billed
  * 
  * required params
  * @spendgo_id
  * @store_code
  * @orderId // requied at "billed" of order status
  * @orderSource
  * @orderSubtotal 
  * @orderTotal 
  * @orderBasket
  *     @posEntries
  *         @posItem
  *             @label
  *             @cost
  *         @quantity
  * Example: JSON body
  * {
  *     "status"  : "checkout",
  *     "vendor"  : "999999",
  *     "brand"   : "33559",
  *     "id"      : "988654417", // requied at "billed" of order status
  *     "source"  : "mobileweb",
  *     "subtotal": 100,
  *     "total"   : 120,
  *     "basket"  : {
  *         "posEntries":[{
  *               "posItem": {
  *                   "lable"   : "Turkey Sandwich",
  *                   "cost"    : 12.99,
  *               }，
  *               "quantity": 2
  *         }]
  *     }
  * 
  * Success: return
  * {
  *     status: 200,
  *     result: { transaction: { id: '5961839', status: 'billed' } }
  * }
  */
async function orderBilled(spendgo_id, store_code, orderId, orderSource, orderSubtotal, orderTotal, orderBasket) {
  // Spendgo API path
  var path = `/loyalty/accounts/${spendgo_id}/orders`;

  // create request data
  let jsonData = JSON.stringify({
    status: 'billed',
    vendor: store_code,
    brand: SPENDGO_ACCOUNT_ID,
    id: orderId,
    source: orderSource,
    subtotal: orderSubtotal,
    total: orderTotal,
    basket: orderBasket
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }
  
  // request data, return data
  return await axiosRequest(config);
}

/**
  * order status is voided(same as "billed")
  * 
  */
 async function orderVoided(spendgo_id, store_code, orderId, orderSource, orderSubtotal, orderTotal, orderBasket) {
  // Spendgo API path
  var path = `/loyalty/accounts/${spendgo_id}/orders`;

  // create request data
  let jsonData = JSON.stringify({
    status: 'voided',
    vendor: store_code,
    brand: SPENDGO_ACCOUNT_ID,
    id: orderId,
    source: orderSource,
    subtotal: orderSubtotal,
    total: orderTotal,
    basket: orderBasket
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }
  
  // request data, return data
  return await axiosRequest(config);
}

/**
  * order status is completed(same as "billed")
  * 
  */
 async function orderCompleted(spendgo_id, store_code, orderId, orderSource, orderSubtotal, orderTotal, orderBasket) {
  // Spendgo API path
  var path = `/loyalty/accounts/${spendgo_id}/orders`;

  // create request data
  let jsonData = JSON.stringify({
    status: 'completed',
    vendor: store_code,
    brand: SPENDGO_ACCOUNT_ID,
    id: orderId,
    source: orderSource,
    subtotal: orderSubtotal,
    total: orderTotal,
    basket: orderBasket
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }
  
  // request data, return data
  return await axiosRequest(config);
}

/**
  * order status is refunded(same as "billed")
  * 
  */
 async function orderRefunded(spendgo_id, store_code, orderId, orderSource, orderSubtotal, orderTotal, orderBasket) {
  // Spendgo API path
  var path = `/loyalty/accounts/${spendgo_id}/orders`;

  // create request data
  let jsonData = JSON.stringify({
    status: 'refunded',
    vendor: store_code,
    brand: SPENDGO_ACCOUNT_ID,
    id: orderId,
    source: orderSource,
    subtotal: orderSubtotal,
    total: orderTotal,
    basket: orderBasket
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }
  
  // request data, return data
  return await axiosRequest(config);
}



/**
 * Exchange authorization code for an access token
 * 
 * POST /oauth2/v1/token
 * 
 * @authorizationCode: (STRING - REQUIRED) the code get from SPENDGO_REDIRECT_URI after user login and grant permission
 * 
 * Success:
 * Example:
 * {
 *    "access_token": "6915ab99857fec1e6f2f6c078583756d0c09d7207750baea28dfbc3d4b0f2cb80"
 * }
 */
async function oauthExchangeForToken(authorizationCode) {
  // Spendgo API path
  let path = '/oauth2/v1/token';

  // create request data in qs type, because header is application/x-www-form-urlencoded
  let qsData = querystring.encode({
    grant_type: 'authorization_code',
    client_id: SPENDGO_OAUTH_API_KEY,
    client_secret: SPENDGO_OAUTH_API_SECRET,
    redirect_uri: SPENDGO_REDIRECT_URI,
    code: authorizationCode
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_OAUTH_URL + path, // attention: it's a SPENDGO_MOBILE_URL url
    headers: { 'content-type': 'application/x-www-form-urlencoded' }, // do not using json, it will return err
    data: qsData
  }

  // request data, return data
  return await axiosRequest(config);
}
 
/**
 * Retrieve a member
 * Get any member’s information after the authentication process is completed.
 *
 * GET /oauth2/member/v1/get
 * 
 * @access_Token
 * 
 * Success:
 * Example response (200):
 * {
 *    "id"          : "123456",
 *    "first_name"  : "Jane",
 *    "last_name"   : "Smith",
 *    "email"       : "jane@ example.com",
 *    "mobile_phone": "4155555555",
 *    "dob": null
 * }
 * Errors:
 */
async function oauthRetrieveMember(accessToken) {
  // Spendgo API path
  let path = '/oauth2/member/v1/get';

  // create request config
  let config = {
    url: SPENDGO_OAUTH_URL + path, // attention: it's a SPENDGO_MOBILE_URL url
    headers: { 'Authorization': 'Bearer ' + accessToken }
  }

  // request data, return data
  return await axiosRequest(config);
}
