jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'SM_TEST' })
      }
    }))
  };
});

jest.mock('@sendgrid/mail', () => {
  const send = jest.fn().mockResolvedValue([{ headers: { 'x-message-id': 'MSG_TEST' } }]);
  return {
    __esModule: true,
    default: {
      setApiKey: jest.fn(),
      send
    }
  };
});

jest.mock('@slack/web-api', () => {
  return {
    WebClient: jest.fn().mockImplementation(() => ({
      chat: {
        postMessage: jest.fn().mockResolvedValue({ ok: true, ts: '123.456' })
      }
    }))
  };
});


