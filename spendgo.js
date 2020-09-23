'use strict';

// ENV variables
const SPENDGO_ACCOUNT_ID = '';
const SPENDGO_URL        = 'https://webservice.skuped.com';
const SPENDGO_API_KEY    = '';
const SPENDGO_API_SECRET = '';
const SPENDGO_WEB_CONTEXT = '?';
const SPENDGO_MOBILE_URL        = 'https://my.skuped.com';
const SPENDGO_MOBILE_API_KEY    = '?';
const SPENDGO_MOBILE_API_SECRET = '?';

// third party node modules
const axios = require('axios');
const { createHmac } = require('crypto');

/**
 * Create HTTP Headers:
 * @apiPath: (STRING) uri for generate X-Class-Signature
 * @rawJson: (STRING - OPTIONAL) body for generate X-Class-Signature
 * return (STRING)
 */
function createHeaders(apiPath, rawJson='') {
  let apiKey = '';
  let secret = '';

  if(apiPath.startsWith('/loyalty/accounts')){
    apiKey = SPENDGO_API_KEY;
    secret = SPENDGO_API_SECRET;
  } else if (apiPath.startsWith('/mobile/gen')) {
    apiKey = SPENDGO_MOBILE_API_KEY;
    secret = SPENDGO_MOBILE_API_SECRET;
  } else {
    console.log(`Error! Wrong API path name.`)
  }

  // decoded Shared Secret key from base64 to utf8
  var decodeSecret = Buffer.from(secret, 'base64').toString('utf8');

  // content(uri + body)
  var beforeEncodedBody = apiPath + rawJson;

  // generated signature using decoded shared secret key
  // example: hmac("sha256", (uri + body), Base64Decoded(base64_encoded_secret))
  var signature = createHmac('sha256', decodeSecret).update(beforeEncodedBody).digest('base64')
  
  var httpHeaders = {
    'X-Class-Key'      : apiKey,
    'X-Class-Signature': signature,
    'Content-Type'     : 'application/json'
  }

  return httpHeaders
}

// HTTP request using axios
async function axiosRequest(config) {
  try {
    let res = await axios(config)
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
  serverOrderCheckout,
  // oauth2
  oauth2RetrieveMember,
  // Mobile API key, Mobile
  mobileRetrieveMemberStatus,  //api 2.1.1
  mobileCreateMember,
  mobileUpdateMember,
  mobileRetrieveBalance,  //api 2.1.1
  mobileSignIn,
  mobileRefreshToken,  //api 2.1.1
  mobileRetrieveMember,  //api 2.1.1
  mobileSignOut,
  mobileResetPassword,
  mobileNearStores  //api 2.1.1
}

/**ok
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
 * 
 * Errors:
 * { status: 400, result: { code: 2003, details: 'Invalid customer phone number' }}
 */
async function serverCreateMember(phone, optionalObject) {
  // Spendgo API path
  let path = '/loyalty/accounts'
  
  // create request data
  let jsonData = JSON.stringify({
    customer: {
      phone: phone,
      ...optionalObject
    }
  })

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }

  // request data, return data
  return axiosRequest(config)
}

/**ok
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
  };

  // request data, return data
  return axiosRequest(config)
}

/**err
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
  var path = `/loyalty/accounts/${spendgo_id}/rewards?store=${store_code}`

  // create request config
  var config = {
    method: 'get',
    url: SPENDGO_URL + path,
    headers: createHeaders(path),
  };

  // request data, return data
  return axiosRequest(config)
}

/**err
 * ordering workflow
 * 
 * Posts a member’s order at the various stages of their ordering workflow.
 * Each stage in the ordering workflow has a corresponding order status to be inserted in the request.
 *
 * POST loyalty/accounts/<SPENDGO_ID>/orders
 *
 * REQUIRED params
 * @spendgo_id: (STRING - REQUIRED) member’s Spendgo unique identifier.
 * @id: (string Optional) order id generated by the commerce system. Required at or after the “placed” order status.
 * @source (string Required) order source. Values are “web” for desktop, “mobileweb” for mobile web, “mobileapp” for mobile apps, or “instore” for in-store orders.
 * @transaction: (string Optional) when “refunded” status, this is an external reference sent from Spendgo at the “billed” or “completed” status.
 * @status (string Required) order status. Values are “checkout”, “placed”, “billed”, “completed”, “voided”, and “refunded”.
 * @ type: (string Optional) order type. Values are “regular” or “catering”.
 * @rendition: (string Optional) Values are “onsite”, “pickup”, or “delivery”.
 * @currency: (string Optional) three-letter ISO 4217 code.
 * @placed: (string Optional) date‐time formatted as YYYY-MM-DDTHH:MM:SSZ. This is when the order was created, but does not indicate when the order was paid or when the customer receives the order. For example the order is placed on 3/1/2020 @ 10am to be picked up on 3/3/2020 @ noon.
 * @wanted: (string Optional) date‐time formatted as YYYY-MM-DDTHH:MM:SSZ. This represents the time when the customer receives the order. For example, the order is placed on 3/1/2018 @ 10am to be picked up on 3/3/2018 @ noon.
 * @vendor (string Required) store code.
 * @brand (string Required) brand’s unique Spendgo ACCOUNT_ID provided by Spendgo.
 * @subtotal (decimal Required) order subtotal — order cost before applying tax, tip, delivery, and discount.
 * @tax: (decimal Optional) order tax amount.
 * @tip: (decimal Optional) order tip amount.
 * @delivery: (decimal Optional) delivery cost.
 * @discount: (decimal Optional) discount amount. This is the sum of all discounts being applied to the cart.
 * @total: (decimal Optional) order total — the sum of subtotal, delivery, tip, tax, and discounts.
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
 * @basket (array Required) order details.
 *    @uuid: (string Optional) ordering transaction identifier. 
 *    @rewards: (array Optional). Corresponds to the reward discounts on the order. 
 *        @provider: (string Optional). When redeeming a reward, the required value is “Spendgo”. 
 *        @id: (string Optional). When redeeming a reward, the required value is the corresponding id returned in the Retrieve member rewards by store request. 
 *        @level: (string Optional). When redeeming a reward, the value is “basket”. 
 *        @product: (string Optional) product item SKU.
 *        @discount: (decimal Optional). This is required when redeeming a reward. When the order status is “checkout”, the value is the reward.value returned in the Retrieve member rewards by store request. The response will include the validated discount value — you will use the validated value in subsequent order calls.
 *    @posEntries (array Required) order items. 
 *        @posItem (array Required) item details. 
 *            @product: (string Optional) item product identifier. 
 *            @modifiers: (array Optional) modifications or add-ons to an item.
 *                @product: (string Optional) modifier product identifier. 
 *                @modifiers: (array Optional) modifications or add-ons to a modifier. 
 *                @label: (string Optional) item modifier name. Required when a modifier is present. 
 *                @cost: (decimal Optional) item modifier cost value. Required when a modifier is present. 
 *                @categories: (array Optional) modifier categories. 
 *                @quantity: (integer Optional) quantity of modifier added to item. Required when a modifier is present.
 *            @label: (string Required) item name. 
 *            @cost: (decimal Required) item unit cost value. 
 *            @categories: (string Optional) item categories.
 *            @quantity: (integer Required) item quantity added to order.
 * 
 * Success: return 
 * Example response (200):
 * { "transaction": { "discount": 5.00, "status": "checkout" } }
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
async function serverOrderCheckout(spendgo_id, store_code, optionalObject) {
  // Spendgo API path
  var path = `/loyalty/accounts/${spendgo_id}/orders`

  // create request data
  let jsonData = JSON.stringify({
    vendor: store_code,
    brand: SPENDGO_ACCOUNT_ID,
    ...optionalObject
  })

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_URL + path,
    headers: createHeaders(path, jsonData),
    data: jsonData
  }
  
  // request data, return data
  return axiosRequest(config)
}

/**TODO
 * 
 */
async function serverOrderPlaced() {}
async function serverOrderBilled() {}
async function serverOrderCompleted() {}
async function serverOrderVoid() {} // order failed
async function serverOrderRefund() {}


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
 *    "mobile_phone": "4155555555"
 * }
 * Errors:
 */
async function oauth2RetrieveMember(accessToken) {
  let path = '/oauth2/member/v1/get';

  let config = {
    url: SPENDGO_URL + path,
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  };

  // request data, return data
  return axiosRequest(config)
}

// Mobile API ??? below

/**
 * API 2.1.1 - Retrieve a member status
 * 
 * POST /mobile/gen/<WEB_CONTEXT>/v1/lookup
 * 
 * @phone​: (s​tring​ Required) if you are looking up by the member’s phone number.
 * @email: ​(string R​equired) if you are looking up by the member’s email address.
 * @check_email_validated_status: ​(boolean O​ptional) applicable only if you are looking up by the member’s email address. Set value to t​ rue​ to check whether the user previously tried to create an account but did not validate their email to complete the registration process.
 * 
 * Success:
 * {
 *    "status": ​"Activated"​,
 *    "linked_to_account": ​true
 * }
 * 
 * Errors:
 */
async function mobileRetrieveMemberStatus(phone, email, checkEmailValidate=false) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/lookup`;

  // create request data
  let jsonData = JSON.stringify({
    phone: phone,
    email: email,
    check_email_validated_status: checkEmailValidate
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_MOBILE_URL + path,
    headers: createHeaders(path, jsonData),
    body: jsonData
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Creates a member linked with your account.
 *
 * POST /mobile/gen/<WEB_CONTEXT>/v1/add
 *
 * REQUIRED params
 * @phone: (STRING - REQUIRED) member’s phone number. 
 * @email: (STRING - REQUIRED) member’s email address. 
 * @password: (STRING - REQUIRED) member’s password.
 * OPTIONAL params
 * @first_name: ​(string​ Optional) member’s first name.
 * @last_name: ​(string​ Optional) member’s last name.
 * @dob: ​(string​ Optional) member’s date of birth formatted as YYYY-MM-DD. 
 * @gender: (​string​ Optional) member’s gender. Values are “M” or “F”.
 * @marital_status: ​(string​ Optional) member’s marital status. Values are “Single”, “Married”, “Divorced”, or “Domestic Partner”.
 * @street: ​(string​ Optional) member’s street address.
 * @unit: ​(string​ Optional) member’s address unit.
 * @city: ​(string​ Optional) member’s city name.
 * @state: ​(string​ Optional) member’s 2-letter state abbreviation (e.g. CA)
 * @zip: ​(string​ Optional) member’s zip code.
 * @favorite_store_id: ​(integer​ Optional) Spendgo unique identifier of the member’s favorite store.
 * @sms_opt_in: ​(boolean​ Optional) member’s text subscription preference for your brand. If value is true, once the user has validated their account creation, they will be sent the text double opt-in flow to confirm their text subscription.
 * @email_opt_in: ​(boolean​ Optional) member’s email marketing preference for your brand.
 * @research_opt_in: ​(boolean​ Optional) member’s research survey opt-in preference.
 * 
 * Success: 
 * Example response (200):
 * { 
 *   "spendgo_id": "494979", 
 *   "username": "janesmith" 
 * }
 * 
 * Errors:
 */
async function mobileCreateMember(phone, email, password, optionalObject) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/add`;

  // create request data
  let jsonData = JSON.stringify({
    phone: phone,
    email: email,
    password: password,
    ...optionalObject
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_MOBILE_URL + path,
    headers: createHeaders(path, jsonData),
    body: jsonData
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Update a member
 * 
 * Modify the current signed in member and their preferences. An Authorization Token is required. 
 * At least the member’s ​phone number​ and s​pendgo_id​ are required as the unique reference in the request. 
 * Both phone and the spendgo_id cannot be updated.
 *
 * POST /mobile/gen/<WEB_CONTEXT>/v1/update
 *
 * @access_token: in Headers
 * 
 * required params
 * @phone: "4155555555",
 * @spendgo_id: "494979", 
 * optional params
 * { 
 *   "email": "Jane@ example.com", 
 *   "password": "", 
 *   "first_name": "Jane", 
 *   "last_name": "Smith", 
 *   "dob": "2000-12-31", 
 *   "gender": "f", 
 *   "martital_status": "", 
 *   "street": "123 Street",
 *   "unit": "",
 *   "city": "San Francisco", 
 *   "state": "CA", 
 *   "zip": "94107", 
 *   "favorite_store_id": 999999, //member’s favorite store number
 *   "sms_opt_in": false, //member’s text subscription preference for your brand. Once the user has validated their account creation, they will be sent the text double opt-in flow to confirm their text subscription.
 *   "email_opt_in": false, //member’s email marketing preference for your brand.
 *   "research_opt_in": false
 *   "email_validated": false, 
 * }
 * 
 * Success: 
 * Example response (200):
 * {}
 * 
 * Errors:
 */
async function mobileUpdateMember(accessToken, phone, spendgo_id, optionalObject) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/update`;

  // create request data
  let jsonData = JSON.stringify({
    phone: phone,
    spendgo_id: spendgo_id,
    ...optionalObject
  });

  // create request config
  let config = {
    url: SPENDGO_MOBILE_URL + path,
    headers: {
      ...createHeaders(path, jsonData),
      Authorization: 'Bearer ' + accessToken
    },
    body: jsonData
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Retrieve member balance
 * 
 * Get the member’s rewards balance by their spendgo unique id. An authorization token is required. 
 *
 * GET /mobile/gen/<WEB_CONTEXT>/v1/balance
 *
 * @access_token: add in Headers
 * 
 * required params
 * @spendgo_id: "494979", 
 * 
 * Success: 
 * Example response (200):
 * {
 *   "quantity": 0.0,
 *   "spend_threshold": 50.0,
 *   "Units": "points",
 *   "label": "$5 Off",
 *   "rewards": [
 *     {
 *       "currency": "USD",
 *       "offer": "rebate",
 *       "label": "$5 Off",
 *       "value": 5.0,
 *       "quantity": 1.0,
 *       "reference": {
 *           "Type": "promo",
 *           "code": "5OFF"
 *       }
 *     },
 *     {
 *       "currency": "USD",
 *       "offer": "Discount",
 *       "label": "10% off on Cold Beverages",
 *       "value": 8.0,
 *       "next_expires_on": "2040-03-23",
 *       "quantity": 1.0,
 *       "reference": {
 *           "type": "promo",
 *           "code": ""
 *       }
 *     }
 *   ]
 * }
 * Errors:
 */
async function mobileRetrieveBalance(accessToken, spendgo_id) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/balance`;

  // create request data
  let jsonData = JSON.stringify({
    spendgo_id: spendgo_id
  });

  // create request config
  let config = {
    url: SPENDGO_MOBILE_URL + path,
    headers: {
      ...createHeaders(path, jsonData),
      Authorization: 'Bearer ' + accessToken
    },
    body: jsonData
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Sign in member
 * 
 * POST /mobile/gen/<WEB_CONTEXT>/v1/signin
 *
 * REQUIRED params
 * @value: (STRING - REQUIRED)  member’s email or phone number.
 * @password: (STRING - REQUIRED) member’s password.
 * 
 * OPTIONAL params
 * { 
 *   "device_id":"2fc4b5912826ad1", //unique device ID to identify the device log in source.
 *   "os_name": "Android",
 *   "os_version":"10.0",
 *   "manufacturer": "Samsung"
 * }
 * 
 * Success: 
 * Example response (200):
 * {
 *     "spendgo_id":​"6522"​,
 *     "access_token":"42475b51d4f0e79bb8692e2f67afe9df66c2e7bdc71e227ebd9a"​,
 *     "access_token_expires_in_secs":​600​, 
 *     "access_token_expires_on":​1598961687681​, 
 *     "refresh_token":"42475b86b791f70e661ee635a8dde9a557b3ff47ad8f9bf83cb2d1"​,
 *     "refresh_token_expires_in_secs":​5184000​, 
 *     "refresh_token_expires_on":​1604145087681
 * }
 * 
 * Errors:
 */
async function mobileSignIn(value, password, optionalObject) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/signin`;

  // create request data
  let jsonData = JSON.stringify({
    value: value,
    password: password,
    ...optionalObject
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_MOBILE_URL + path,
    headers: createHeaders(path, jsonData),
    body: jsonData
  };
  
  // request data, return data
  return axiosRequest(config)
}

/**
 * Refresh Token
 * To refresh the expiry time of the access token before or after it has expired. 
 *
 * POST /mobile/gen/<WEB_CONTEXT>/v1/signin/refreshtoken
 *
 * @access_token: add in Headers
 * 
 * Success: 
 * Example response (200):
 * {
 *     "spendgo_id":​"6522"​,
 *     "access_token":"42475b51d4f0e79bb8692e2f67afe9df66c2e7bdc71e227ebd9a"​,
 *     "access_token_expires_in_secs":​600​, 
 *     "access_token_expires_on":​1598961687681​, 
 *     "refresh_token":"42475b86b791f70e661ee635a8dde9a557b3ff47ad8f9bf83cb2d1"​,
 *     "refresh_token_expires_in_secs":​5184000​, 
 *     "refresh_token_expires_on":​1604145087681
 * }
 * Errors:
 */
async function mobileRefreshToken(accessToken) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/signin/refreshtoken`;

  // create request config
  let config = {
    url: SPENDGO_MOBILE_URL + path,
    headers: {
      ...createHeaders(path),
      Authorization: 'Bearer ' + accessToken
    }
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Retrieve a member
 * Get any member’s information after the member sign in is successful.
 *
 * POST /mobile/gen/<WEB_CONTEXT>/v1/get
 *
 * @access_token: add in Headers
 * 
 * Success: 
 * Example response (200):
 * {
 *     "merchant_id": 33559,
 *     "is_activated": true,
 *     "spendgo_id": "6522",
 *     "username": "user999",
 *     "phone": "9999999999",
 *     "email": "joe@ example.com",
 *     "first_name": "Joe",
 *     "last_name": "Smithson",
 *     "dob": "1990-12-14",
 *     "gender": "M",
 *     "marital_status": "Single",
 *     "street": "2196 3rd Street",
 *     "unit": "1111",
 *     "city": "San Francisco",
 *     "state": "CA",
 *     "zip": "94107",
 *     "sms_opt_in": true,
 *     "email_opt_in": false,
 *     "favorite_store_id": 33627,
 *     "favorite_store": {
 *          "id": 33627,
 *          "code": "999999",
 *          "name": "Spendgo Demo Store",
 *          "street": "2196 3rd Street",
 *          "city": "San Francisco",
 *          "state": "CA",
 *          "zip": "94107",
 *          "longitude": -122.38888549804688,
 *          "latitude": 37.76190948486328,
 *          "hours": "",
 *          "phone": "4159065250",
 *     },
 *     "consumer_meta_data": [
 *         {
 *          "timestamp_created": "2020-08-26T07:15:05.000",
 *          "type_name": "spouse",
 *          "user_data": "1979-01-13",
 *          "label": "spouse",
 *          "type_category": "birthday",
 *          "type": "date"
 *         }
 *     ],
 *     "addtl_info": [
 *         {
 *             "sms_double_opt_in_status": "WaitingDoubleOptInConfirmation"
 *         }
 *     ]
 * }
 * Errors:
 */
async function mobileRetrieveMember(accessToken) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/get`;

  // create request config
  let config = {
    url: SPENDGO_MOBILE_URL + path,
    headers: {
      ...createHeaders(path),
      Authorization: 'Bearer ' + accessToken
    }
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Sign out member
 * Logs a member out of their account after having been signed in. An Authorization Token is required. 
 *
 * POST /mobile/gen/<WEB_CONTEXT>/v1/signoff
 *
 * @access_token: add in Headers
 * 
 * Success: 
 * Example response (200):
 * {}
 * 
 * Errors:
 */
async function mobileSignOut(accessToken) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/signoff`;

  // create request config
  let config = {
    url: SPENDGO_MOBILE_URL + path,
    headers: {
      ...createHeaders(path),
      Authorization: 'Bearer ' + accessToken
    }
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Reset member password
 * Triggers a reset password flow which sends an email with a reset password link to the member’s account email address.
 * 
 * POST /mobile/gen/<WEB_CONTEXT>/v1/forgotPassword
 * 
 * @email: (string​ Required) member’s email address.
 * 
 * Success: 
 * Example response (200):
 * {}
 * 
 * Errors:
 */
async function mobileResetPassword(email) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/forgotpassword`;

  // create request data
  let jsonData = JSON.stringify({
    email: email
  });

  // create request config
  let config = {
    method: 'post',
    url: SPENDGO_MOBILE_URL + path,
    headers: createHeaders(path, jsonData),
    body: jsonData
  };

  // request data, return data
  return axiosRequest(config)
}

/**
 * Retrieve stores nearly
 * Get a list of that account’s nearby stores based on the distance from a zip code or the latitude and longitude combination.
 * 
 * GET /mobile/gen/<WEB_CONTEXT>/v1/nearestStores
 * 
 * zip​ (s​tring ​Optional) 5-digit postal code.
 * distance​ (i​nteger​ Optional).The distance in miles from zip or longitude and latitude.
 * latitude​ (i​nteger​ Optional)latitude.Always use latitude in combination with longitude.
 * longitude ​(integer​ Optional) longitude. Always use latitude in combination with longitude.
 * country​ (​string​ Optional). 2-letter country code e.g. “US”
 * Example:
 * {"zip":​"94107"​,"distance":​50​}
 * {"latitude":​30.59437370300293​,"longitude":​-88.16300964355469​}
 * 
 * Success: 
 * Example response (200):
 * [
 *    {
 *        "id":​33627​,
 *        "name":​"Spendgo Demo Store"​, 
 *        "code":​"999999"​,
 *        "street":​"2196 3rd Street"​, 
 *        "city":​"San Francisco"​, 
 *        "state":​"CA"​,
 *        "zip":​"94107"​, 
 *        "phone":​"4159065250"​, 
 *        "hours":​""​, 
 *        "latitude":​37.76190948486328​, 
 *        "longitude":​-122.38888549804688
 *    }
 * ]
 * 
 * Errors:
 */
async function mobileNearStores(position) {
  // Spendgo API path
  let path = `/mobile/gen/${ SPENDGO_WEB_CONTEXT }/v1/nearestStores`;

  // create request data
  let jsonData = JSON.stringify(position);

  // create request config
  let config = {
    method: 'get',
    url: SPENDGO_MOBILE_URL + path,
    headers: createHeaders(path, jsonData),
    body: jsonData
  };

  // request data, return data
  return axiosRequest(config)
}