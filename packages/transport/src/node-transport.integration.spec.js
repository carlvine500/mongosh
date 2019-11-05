const NodeTransport = require('./node-transport');
const { expect } = require('chai');
const sinon = require('sinon');

describe('NodeTransport [ integration ]', () => {
  before(require('mongodb-runner/mocha/before')({ port: 27018 }));
  after(require('mongodb-runner/mocha/after')({ port: 27018 }));

  describe('.fromURI', () => {
    let nodeTransport;

    before(async () => {
      nodeTransport = await NodeTransport.fromURI('mongodb://localhost:27018');
    });

    after(() => {
      return nodeTransport.mongoClient.close(true);
    });

    it('returns a NodeTransport with mongo client set', () => {
      expect(nodeTransport.mongoClient).to.not.equal(undefined);
    });

    it('contains a connected mongo client', () => {
      expect(nodeTransport.mongoClient.isConnected()).to.equal(true);
    });
  });

  describe('#aggregate', () => {
    let nodeTransport;

    before(async () => {
      nodeTransport = await NodeTransport.fromURI('mongodb://localhost:27018');
    });

    after(() => {
      return nodeTransport.mongoClient.close(true);
    });

    context('when the aggregation is valid', () => {
      let result;

      beforeEach(async () => {
        result = await nodeTransport.
          aggregate('music', 'bands', [{ $match: { name: 'Aphex Twin' }}]);
      });

      it('executes the command and resolves the result', () => {
        return result.toArray().then((docs) => {
          expect(docs).to.deep.equal([]);
        });
      });
    });
  });

  describe('#distinct', () => {
    let nodeTransport;

    before(async () => {
      nodeTransport = await NodeTransport.fromURI('mongodb://localhost:27018');
    });

    after(() => {
      return nodeTransport.mongoClient.close(true);
    });

    context('when the distinct is valid', () => {
      let result;

      beforeEach(async () => {
        result = await nodeTransport.distinct('music', 'bands', 'name');
      });

      it('executes the command and resolves the result', () => {
        expect(result).to.deep.equal([]);
      });
    });
  });

  describe('#countDocuments', () => {
    let nodeTransport;

    before(async () => {
      nodeTransport = await NodeTransport.fromURI('mongodb://localhost:27018');
    });

    after(() => {
      return nodeTransport.mongoClient.close(true);
    });

    context('when the filter is empty', () => {
      let result;

      beforeEach(async () => {
        result = await nodeTransport.countDocuments('music', 'bands');
      });

      it('executes the count with an empty filter and resolves the result', () => {
        expect(result).to.equal(0);
      });
    });
  });

  describe('#estimatedDocumentCount', () => {
    let nodeTransport;

    before(async () => {
      nodeTransport = await NodeTransport.fromURI('mongodb://localhost:27018');
    });

    after(() => {
      return nodeTransport.mongoClient.close(true);
    });

    context('when no options are provided', () => {
      let result;

      beforeEach(async () => {
        result = await nodeTransport.estimatedDocumentCount('music', 'bands');
      });

      it('executes the count and resolves the result', () => {
        expect(result).to.equal(0);
      });
    });
  });

  describe('#runCommand', () => {
    let nodeTransport;

    before(async () => {
      nodeTransport = await NodeTransport.fromURI('mongodb://localhost:27018');
    });

    after(() => {
      return nodeTransport.mongoClient.close(true);
    });

    context('when the command is valid', () => {
      let result;

      beforeEach(async () => {
        result = await nodeTransport.runCommand('admin', { ismaster: true });
      });

      it('executes the command and resolves the result', () => {
        expect(result.ismaster).to.equal(true);
      });
    });
  });
}).timeout(30000);