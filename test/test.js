const spendgo = require('../')
const expect  = require('chai').expect
const faker = require('faker')

describe('# testing all Spendgo API', ()=>{

  describe('# create member', ()=> {
    // createMember - phone
    // @phone: (STRING)
    // retrun { status: 201, result: { id: '496630', status: 'Active' } }
    it('should success with phone number only', async function() {
      let fixturePhone = faker.phone.phoneNumber('!##!##!###')
      let res = await spendgo.serverCreateMember(fixturePhone)
      expect(res.status).to.equal(201)
      expect(res.result).to.have.property('id')
      expect(res.result).to.have.property('status')
    })
  
    // createMember - params(phone + optional)
    // @phone: (STRING)
    // @optionalObject: (OBJECT)
    // retrun { status: 201, result: { id: '496630', status: 'Active' } }
    it('should success with phone number and optional params', async function() {
      let fixturePhone = faker.phone.phoneNumber('!##!##!###')
      let fixtureOptionalObject = {
        email: faker.internet.exampleEmail(),
        name: {
          last: faker.name.lastName(),
          first:'John'
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
        favorite_store_id: '999999',
        sms_opt_in: false,
        email_opt_in: false,
        verify_email: false
      }
      let res = await spendgo.serverCreateMember(fixturePhone, fixtureOptionalObject)
      expect(res.status).to.equal(201)
      expect(res.result).to.have.property('id')
      expect(res.result).to.have.property('status')
    })

    // createMember - with email verification
    // @phone: (STRING)
    // @optionalObject: (OBJECT)
    // return { status: 202, result: { status: 'WaitingEmailVerification' } }
    it('should success with email verification', async function() {
      let fixturePhone = faker.phone.phoneNumber('!##!##!###')
      let fixtureOptionalObject = {
        email: faker.internet.exampleEmail(),
        name: {
          last: faker.name.lastName(),
          first:'John'
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
        favorite_store_id: '999999',
        sms_opt_in: false,
        email_opt_in: false,
        verify_email: true  // true: send email to verify
      }
      let res = await spendgo.serverCreateMember(fixturePhone, fixtureOptionalObject)
      expect(res.status).to.equal(202)
      expect(res.result).to.have.property('status').to.equal('WaitingEmailVerification')
    })

    it('should success if phone existed', async function() {
      let fixturePhone = faker.phone.phoneNumber('!##!##!###')
      let res = await spendgo.serverCreateMember(fixturePhone)
      let res2 = await spendgo.serverCreateMember(fixturePhone)
      expect(res2.status).to.equal(200)
      expect(res2.result).to.have.property('id')
      expect(res2.result).to.have.property('status')
    })

  })

  describe('# retrieve member balance', ()=> {
    // Retrieve member balance 
    // @spendgo_id: (STRING)
    // return { status: 200, result:{ quantity: 0, spend_threshold: 50, units: 'points', label: '$5 Off', rewards: []}}
    it('should success with result', async function() {
      let fixturePhone = faker.phone.phoneNumber('!##!##!###')
      let res = await spendgo.serverCreateMember(fixturePhone)
      let fixtureSpendgoID = res.result.id
      let res2 = await spendgo.serverRetrieveBalance(fixtureSpendgoID)
      expect(res2.status).to.equal(200)
      expect(res2.result).to.have.property('quantity')
      expect(res2.result).to.have.property('units').to.be.oneOf(['points','visits','stamps'])
      expect(res2.result).to.have.property('label')
      expect(res2.result).to.have.property('rewards').to.be.an('array')
    })
  })
})
