import { describe, expect, it } from 'vitest';
import { MAX_MSG_BYTES, TokenBucket, parseClientMsg, randomRoomCode, sanitizeConfig, sanitizeName } from '../../shared/protocol';

describe('sanitizeName', () => {
  it('quita HTML y caracteres raros', () => {
    expect(sanitizeName('<b>Ana</b>')).toBe('bAnab');
    expect(sanitizeName('  Pepe   el  Grande ')).toBe('Pepe el Grande');
    expect(sanitizeName('José ¡Olé!')).toBe('José ¡Olé!');
  });
  it('limita a 16 caracteres', () => {
    expect(sanitizeName('a'.repeat(40))).toHaveLength(16);
  });
  it('rechaza lo que no es texto', () => {
    expect(sanitizeName(42)).toBe('');
    expect(sanitizeName(null)).toBe('');
  });
});

describe('parseClientMsg', () => {
  it('acepta mensajes válidos', () => {
    expect(parseClientMsg('{"t":"hello","v":1,"name":"Ana"}')).toEqual({ t: 'hello', v: 1, name: 'Ana', token: undefined });
    expect(parseClientMsg('{"t":"relay","to":"all","d":{"k":"aim","yaw":1}}')).toEqual({ t: 'relay', to: 'all', d: { k: 'aim', yaw: 1 } });
    expect(parseClientMsg('{"t":"config","config":{"bots":2}}')).toEqual({ t: 'config', config: { bots: 2 } });
  });
  it('rechaza JSON roto, tipos desconocidos y campos malos', () => {
    expect(parseClientMsg('{no json')).toBeNull();
    expect(parseClientMsg('{"t":"hack"}')).toBeNull();
    expect(parseClientMsg('{"t":"hello","v":"1","name":"x"}')).toBeNull();
    expect(parseClientMsg('{"t":"hello","v":1,"name":"x","token":"../../etc"}')).toBeNull();
    expect(parseClientMsg('{"t":"relay","to":"all","d":[1,2]}')).toBeNull();
    expect(parseClientMsg('{"t":"relay","to":"all","d":{"x":1}}')).toBeNull();
    expect(parseClientMsg('{"t":"config","config":{"bots":9}}')).toBeNull();
    expect(parseClientMsg('{"t":"config","config":{"difficulty":"imposible"}}')).toBeNull();
    expect(parseClientMsg(123)).toBeNull();
  });
  it('rechaza mensajes demasiado grandes', () => {
    const big = JSON.stringify({ t: 'relay', to: 'all', d: { k: 's', x: 'a'.repeat(MAX_MSG_BYTES) } });
    expect(parseClientMsg(big)).toBeNull();
  });
});

describe('sanitizeConfig', () => {
  it('valida cada campo', () => {
    expect(sanitizeConfig({ bots: 3, difficulty: 'dificil', fast: true })).toEqual({ bots: 3, difficulty: 'dificil', fast: true });
    expect(sanitizeConfig({ bots: 1.5 })).toBeNull();
    expect(sanitizeConfig({ fast: 'si' })).toBeNull();
  });
});

describe('TokenBucket', () => {
  it('limita la ráfaga y se recarga con el tiempo', () => {
    const b = new TokenBucket(10, 5, 0);
    let ok = 0;
    for (let i = 0; i < 20; i++) if (b.take(0)) ok++;
    expect(ok).toBe(5);
    expect(b.take(50)).toBe(false);
    expect(b.take(150)).toBe(true);
  });
});

describe('randomRoomCode', () => {
  it('genera 4 letras sin I ni O', () => {
    for (let i = 0; i < 200; i++) expect(randomRoomCode()).toMatch(/^[A-HJ-NP-Z]{4}$/);
  });
});
