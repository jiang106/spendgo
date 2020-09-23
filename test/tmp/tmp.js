const spendgo = require('../../spendgo');
const faker = require('faker');

// const fixturePhone = faker.phone.phoneNumber('!##!##!###');
// console.log(fixturePhone);


// spendgo.createMember('9312617267')
//   .then(data => console.log(data))

// spendgo.retrieveBalance('496812')
//   .then(data => console.log(data))

// spendgo.retrieveRewardsByStore('496812','999999')
//   .then(data => console.log(data))


const fixtureOptionalObject = {
  id: '988654417',
  source: 'web',
  transaction: null,
  status: 'checkout',
  type: 'regular',
  rendition: 'delivery',
  currency: null,
  placed: '2020-01-01T 12:00:00Z',
  wanted: '2020-01-01T13:00:00Z',
  subtotal: 10,
  tax: 0.1,
  tip: 0,
  delivery: 0,
  discount: 5,
  total: 5.1,
  address: [
      {
          street: '123 Street',
          cross: '',
          city: 'San Francisco',
          region: 'CA',
          code: 94107,
          country: 'USA'
      }
  ],
  payments: {
      tender: 'credit',
      issuer: 'visa',
      suffix: '1234',
      amount: 5.1
  },
  basket: {
      uuid: '472b564f-ae72-49ac-91cb-f177e21216f8',
      // rewards: [
      //     {
      //         provider: 'Spendgo',
      //         id: '2234402',
      //         level: 'basket',
      //         product: '0',
      //         discount: 5
      //     }
      // ],
      posEntries: [
          {
              posItem: {
                  product: '1082',
                  cost: 5,
                  categories: 'null',
                  label: 'Turkey Sandwich'
              },
              quantity: 2
          }
      ]
  }
}
// spendgo.orderTransaction('496812', '999999', '33804', fixtureOptionalObject)
//   .then(data => console.log(data))

