declare const messages: {
  readonly "onboarding": {
    readonly "usage": string;
    readonly "start": {
      readonly "failure": string;
      readonly "noop": string;
      readonly "success": string;
    };
    readonly "stop": {
      readonly "failure": string;
      readonly "noop": string;
      readonly "success": string;
    };
    readonly "steps": {
      readonly "offset": number;
      readonly "text": string;
    }[];
  };
};

export default messages;
