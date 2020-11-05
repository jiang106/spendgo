const spendgo = require('../../spendgo');
const faker = require('faker');

// const fixturePhone = faker.phone.phoneNumber('!##!##!###');
// console.log(fixturePhone);
const fixtureOptional = {
  email: 'smithjoe@abcd.com',
  name: {
    last:'Smith',
    first:'Joe'
  },
  password: 'Password123',
  dob: '2000-01-01',
  gender: 'm',
  marital_status: 'married',
  address: {
   city: 'San Francisco', 
   state: 'CA', 
   street: '3rd Street', 
   zip: '94107', 
   country: 'US'
  },
  sms_opt_in: false, //member’s text subscription preference for your brand. Once the user has validated their account creation, they will be sent the text double opt-in flow to confirm their text subscription.
  email_opt_in: false, //member’s email marketing preference for your brand.
  verify_email: false
}

/** @serverCreateMember */
// spendgo.serverCreateMember('2579066534', fixtureOptional)
//   .then(data => console.log(data));

/** @serverRetrieveBalance */
// spendgo.serverRetrieveBalance('1009029')
//   .then(data => console.log(data.result.rewards))

/** @serverRetrieveRewardsByStore */
// spendgo.serverRetrieveRewardsByStore('1009029','999999')
//   .then(data => console.log(data.result.rewards));



const fixtureBasket = {
  // uuid: '572b564f-ae72-49ac-91cb-f177e21216f8',
  rewards: [
      {
          provider: 'Spendgo',
          id: 'A18',
          level: 'basket',
          discount: 5
          // product: '0',
      }
  ],
  posEntries: [{                       // required
    
    posItem: {                        // required
      // product   : '1082',
      // categories: 'null',
      cost    : 5,                   // required
      label   : 'Turkey Sandwich'   // required
    },
    quantity: 2                   // required

  },{
    posItem: {                        // required
      // product   : '1082',
      // categories: 'null',
      cost    : 6,                   // required
      label   : 'Chicken Sandwich'   // required
    },
    quantity: 12                   // required
  }]
}
/**order checkout and placed */
// spendgo.orderCheckout('1009026', '999999', 'mobileweb', 84, 89, fixtureBasket)
//   .then(data => console.log(data));
  
// spendgo.orderPlaced('1009026', '999999', 'mobileweb', 84, 89, fixtureBasket)
//   .then(data => console.log(data));

/**order billed and completed */
// spendgo.orderBilled('1009029', '999999','9886544337', 'web', 160, 180, fixtureBasket)
//   .then(data => {
//     console.log(data)

//     spendgo.orderCompleted('1009029', '999999','9886544337', 'web', 160, 180, fixtureBasket)
//       .then(data => console.log(data));
//   });

/**order voided and refunded */
// spendgo.orderVoided('1009026', '999999','988654417', 'mobileweb', 100, 120, fixtureBasket)
//   .then(data => console.log(data));

// spendgo.orderRefunded('1009029', '999999','9886544337', 'web', 160, 180, fixtureBasket)
//   .then(data => console.log(data));