import { Game } from './core/Game';

const game = new Game();

game.init().then(() => {
  game.start();
  console.log('%c★ 星界旅者 %c已启动 %cv0.1.0',
    'color: #e2c275; font-size: 18px;',
    'color: #c8c8d4;',
    'color: #666;');
});

(window as any).__game = game;
