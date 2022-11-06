import OmeggaPlugin, { OL, PS, PC } from 'omegga';

type Config = { foo: string };
type Storage = { bar: string };

export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  private morseMap = { // idc if theres a better way to do this :middle_finger: :rat:
    a: '.-',
    b: '-...',
    c: '-.-.',
    e: '.',
    f: '..-.',
    g: '--.',
    h: '....',
    i: '..',
    j: '.---',
    k: '-.-',
    l: '.-..',
    m: '--',
    n: '-.',
    o: '---',
    p: '.--.',
    q: '--.-',
    r: '.-.',
    s: '...',
    t: '-',
    u: '--.',
    v: '...-',
    w: '.--',
    x: '-..-',
    y: '-.--',
    z: '--..',
    '1': '.----',
    '2': '..---',
    '3': '...--',
    '4': '....-',
    '5': '.....',
    '6': '-....',
    '7': '--...',
    '8': '---..',
    '9': '----.',
    '0': '-----',
    ' ': '\\'
  };

  private lastMessangers = {}; // Used for /r

  private checkPlayer(plr: string): string { // Non-case-sensitive player check
    const lowered = plr.toLowerCase();
    for (const p of this.omegga.getPlayers()) {
      if (p.name.toLowerCase() == lowered) { return p.name; }
    }
    return null;
  }

  private message(speaker: string, sendTo: string, message) {
    const to = this.checkPlayer(sendTo); // Returns the proper cased player name if they exist
    if (!to) {
      this.omegga.whisper(speaker, `Unable to find player ${sendTo}.`);
      return;
    }
    const msgArray = message.split('');
    let size = msgArray.length;
    if (size > 140) {
      this.omegga.whisper(speaker, `<color="ff0000">Maximum message limit of 140 characters.</> [ <color="cf7815">${size}</> ]`);
      return;
    }
    let translatedMessage = '';
    for (let c of msgArray) {
      c = c.toLowerCase();
      if (!this.morseMap.hasOwnProperty(c)) { continue; } // Ignore characters that don't translate
      translatedMessage += this.morseMap[c] + ' '; // idc about a trailing space, deal with it code dweebs
    }
    this.omegga.whisper(to, `<color="ff0000">!</>From ${speaker}: ${translatedMessage}`);
    this.lastMessangers[to] = speaker;
    this.omegga.whisper(speaker, '<color="11ba30">Message sent.</>');
  }

  async init() {
    this.omegga.on('cmd:morse', (speaker: string, to: string, ...message) => {
      if (!to) {
        this.omegga.whisper(speaker, 'A player is required.');
        return;
      }
      if (message.length == 0) {
        this.omegga.whisper(speaker, 'A message is required.');
        return;
      }

      let msg = '';
      message.forEach( (S, i) => {
        if (i > 0) { msg += ' '};
        msg += S;
      });
      if (msg == '') { // Weird edgecase where adding a space after the player counts as length > 0
        this.omegga.whisper(speaker, 'A message is required.');
        return;
      }
      this.message(speaker, to, msg);
    });

    this.omegga.on('cmd:m', (speaker: string, to: string, ...message) => { // Alias of cmd:morse, dunno if theres a better way to do this
      if (!to) {
        this.omegga.whisper(speaker, 'A player is required.');
        return;
      }
      if (message.length == 0) {
        this.omegga.whisper(speaker, 'A message is required.');
        return;
      }

      let msg = '';
      message.forEach( (S, i) => {
        if (i > 0) { msg += ' '};
        msg += S;
      });
      if (msg == '') { // Weird edgecase where adding a space after the player counts as length > 0
        this.omegga.whisper(speaker, 'A message is required');
        return;
      }
      this.message(speaker, to, msg);
    });

    this.omegga.on('cmd:r', (speaker: string, ...message) => {
      if (!this.lastMessangers.hasOwnProperty(speaker)) {
        this.omegga.whisper(speaker, 'You have not gotten any message to reply to.');
        return;
      }

      if (!this.omegga.getPlayer(this.lastMessangers[speaker])) {
        this.omegga.whisper(speaker, `${this.lastMessangers[speaker]} has left the game.`);
        return;
      }

      if (message.length == 0) {
        this.omegga.whisper(speaker, 'A message is required');
        return;
      }

      let msg = '';
      message.forEach( (S, i) => {
        if (i > 0) { msg += ' '}
        msg += S;
      });
      if (msg == '') { // Weird edgecase where adding a space after the player counts as length > 0
        this.omegga.whisper(speaker, 'A message is required');
        return;
      }

      this.message(speaker, this.lastMessangers[speaker], msg);
    });

    return { registeredCommands: ['morse', 'm', 'r'] };
  }

  async leave(player) {
    if (this.lastMessangers.hasOwnProperty(player.name)) {
      delete this.lastMessangers[player.name];
    }
  }

  async stop() {
    // Anything that needs to be cleaned up...
  }
}
