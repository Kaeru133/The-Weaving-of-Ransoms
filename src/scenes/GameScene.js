// Phaser is global from index.html CDN
import Protagonist from '../entities/Protagonist.js';
import Ransom from '../entities/Ransom.js';
import NPC from '../entities/NPC.js';
import Boss from '../entities/Boss.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.keys = null;
        this.mapWidth = 9600;
        this.mapHeight = 1200;
        this.score = 0;
        this.coins = 0;
        this.lastShootTime = 0;
        this.isBeingDamaged = false;
        this.shopSelection = 0;
        this.isWeaponShopOpen = false;
        this.isExchangeOpen = false;
        this.shopKeyListener = null;
        this.manaRegenTimer = 0;
        this.isPaused = false;
    }

    preload() {
        console.log('GameScene: Preload starting');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // graphics.fillStyle(0xffffff, 1);
        // graphics.fillRect(0, 0, 32, 32);
        // graphics.generateTexture('player-sprite', 32, 32);
        // this.load.image('player-sprite', 'assets/sprites/protagonist.png');
        this.load.image('player-sprite', 'assets/sprites/protagonist_sprite_no_bg_1773337148921.png');

        // graphics.clear();
        // graphics.fillStyle(0xff0000, 1);
        // graphics.fillRect(0, 0, 32, 32);
        // graphics.generateTexture('ransom-sprite', 32, 32);
        // this.load.image('ransom-sprite', 'assets/sprites/ransom.png');
        this.load.image('ransom-sprite', 'assets/sprites/ransom_sprite_no_bg_v2_1773337354436.png');

        graphics.clear();
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('npc-sprite', 32, 32);

        graphics.clear();
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(32, 32, 32);
        graphics.generateTexture('shop-sprite', 64, 64);

        graphics.clear();
        graphics.fillStyle(0x00008b, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('weapon-shop-sprite', 64, 64);

        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 4, 24, 4);
        graphics.generateTexture('web-bullet', 24, 8);

        // graphics.clear();
        // graphics.lineStyle(2, 0x1a1a1a, 1);
        // graphics.strokeRect(0, 0, 64, 64);
        // graphics.generateTexture('grid-bg', 64, 64);
        // this.load.image('grid-bg', 'assets/sprites/ground.png');
        this.load.image('grid-bg', 'assets/sprites/creepy_rpg_ground_tile_1773335961842.png');
        this.load.audio('bg-music', 'assets/audio/password-infinity-123276.mp3');
        console.log('GameScene: Preload finished successfully');
    }

    create() {
        try {
            console.log('GameScene: Create starting');
            this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

            this.background = this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, 'grid-bg')
                .setOrigin(0, 0)
                .setDepth(-1)
                .setTint(0x222222); // Darker for better contrast

            console.log('GameScene: Spawning player');
            this.player = new Protagonist(this, this.mapWidth / 2, this.mapHeight / 2);
            this.player.setScale(0.2); // Adjust scale for the detailed illustration

            this.ransoms = this.add.group({
                classType: Ransom,
                runChildUpdate: true
            });

            console.log('GameScene: Spawning ransoms');
            for (let i = 0; i < 45; i++) {
                const rx = Phaser.Math.Between(100, this.mapWidth - 100);
                const ry = Phaser.Math.Between(100, this.mapHeight - 100);
                const r = new Ransom(this, rx, ry);
                this.ransoms.add(r);
                r.setScale(0.15); // Adjust scale for enemy artwork
            }

            this.boss = new Boss(this, 300, 300);
            this.boss.setScale(0.6); // Scale up the boss image 
            this.ransoms.add(this.boss);

            this.shop = this.physics.add.staticImage(this.mapWidth / 2 - 200, this.mapHeight / 2, 'shop-sprite');
            this.add.text(this.shop.x, this.shop.y - 50, 'TROCA', { fontSize: '16px', fill: '#ffff00', fontFamily: 'monospace' }).setOrigin(0.5);

            this.weaponShop = this.physics.add.staticImage(this.mapWidth / 2 + 500, this.mapHeight / 2, 'weapon-shop-sprite');
            this.add.text(this.weaponShop.x, this.weaponShop.y - 50, 'ARMAS', { fontSize: '16px', fill: '#0000ff', fontFamily: 'monospace' }).setOrigin(0.5);

            this.webs = this.physics.add.group();
            this.soundBarrierLayer = this.add.graphics().setDepth(50);
            this.laserLayer = this.add.graphics().setDepth(2000);
            this.aimArrow = this.add.text(0, 0, '-->', { fontSize: '24px', fill: '#00ffff' }).setOrigin(0, 0.5).setDepth(2000).setVisible(false);

            this.keys = this.input.keyboard.addKeys('W,A,S,D');
            this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
            this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
            this.magicKey = this.input.keyboard.addKey(186); // keycode for 'ç'

            this.npcs = this.add.group({ classType: NPC, runChildUpdate: true });
            this.archangel = new NPC(this, this.mapWidth / 2 + 1000, this.mapHeight / 2, 'npc-sprite', 'A luz prevalecerá... em breve você verá a verdade.');
            this.archangel.setTint(0x00ffff).setScale(1.5);
            this.npcs.add(this.archangel);

            // Aura around Archangel
            this.archangelGlow = this.add.graphics().setDepth(1);

            this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
            this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

            this.scoreText = this.add.text(20, 20, 'Ransoms: 0', { fontSize: '18px', fill: '#ff0000' }).setScrollFactor(0).setDepth(2000);
            this.coinsText = this.add.text(20, 50, 'Moedas: 0', { fontSize: '18px', fill: '#ffff00' }).setScrollFactor(0).setDepth(2000);
            this.statusText = this.add.text(20, 80, 'HP: 100 | MANA: 100', { fontSize: '18px', fill: '#00ff00' }).setScrollFactor(0).setDepth(2000);

            this.physics.add.overlap(this.player, this.ransoms, this.handleRansomCombat, null, this);
            this.physics.add.overlap(this.player, this.shop, () => { this.isNearShop = true; });
            this.physics.add.overlap(this.player, this.weaponShop, () => { this.isNearWeaponShop = true; });
            this.physics.add.overlap(this.webs, this.ransoms, this.hitRansom, null, this);

            this.interactionText = this.add.text(400, 500, '', { fontSize: '18px', fill: '#00ff00' }).setOrigin(0.5).setScrollFactor(0).setDepth(2000).setVisible(false);
            this.lastInteractionText = '';
            this.dialogueBox = this.add.container(0, 0).setScrollFactor(0).setDepth(3000).setVisible(false);
            const bgbx = this.add.rectangle(400, 550, 700, 100, 0x000000, 0.8).setStrokeStyle(2, 0x00ff00);
            this.dialogueText = this.add.text(400, 550, '', { fontSize: '18px', fill: '#ffffff', wordWrap: { width: 650 }, align: 'center' }).setOrigin(0.5);
            this.dialogueBox.add([bgbx, this.dialogueText]);

            // Pause functionality
            this.pauseText = this.add.text(400, 300, 'PAUSADO\n[ESC] para continuar', {
                fontSize: '48px', fill: '#ffffff', align: 'center', fontFamily: 'monospace', fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10000).setVisible(false);

            this.input.keyboard.on('keydown-ESC', () => {
                if (!this.player || this.player.isDead) return;
                this.isPaused = !this.isPaused;
                if (this.isPaused) {
                    this.physics.pause();
                    this.pauseText.setVisible(true);
                } else {
                    this.physics.resume();
                    this.pauseText.setVisible(false);
                }
            });

            // Add and play Background Music
            this.bgMusic = this.sound.add('bg-music', { loop: true, volume: 0.5 });
            this.bgMusic.play();

            console.log('GameScene: Create finished successfully');
        } catch (e) {
            console.error('CRITICAL ERROR:', e);
        }
    }

    update(time, delta) {
        if (!this.player || this.player.isDead) return;
        if (this.isPaused) return;

        if (this.laserLayer) this.laserLayer.clear();
        if (this.soundBarrierLayer) {
            this.soundBarrierLayer.clear();

            // Text/Shop normal barrier (Observation range)
            this.soundBarrierLayer.lineStyle(2, 0x00ffff, 0.4); // Neon Cyan
            this.soundBarrierLayer.strokeCircle(this.player.x, this.player.y, 250);

            // Attack sound barrier (Combat range)
            this.soundBarrierLayer.lineStyle(3, 0xff3333, 0.6); // Vivid Red
            this.soundBarrierLayer.strokeCircle(this.player.x, this.player.y, 150);
        }

        this.player.setVelocity(0);
        const speed = 200;
        if (this.keys.A.isDown) this.player.setVelocityX(-speed);
        else if (this.keys.D.isDown) this.player.setVelocityX(speed);
        if (this.keys.W.isDown) this.player.setVelocityY(-speed);
        else if (this.keys.S.isDown) this.player.setVelocityY(speed);

        this.updateNPCs();
        this.updateShops();
        this.updateEnvironmentEffect(); // Background prettier effect
        this.updatePlayerActions(time, delta);

        this.isNearShop = false;
        this.isNearWeaponShop = false;

        if (this.player.hp <= 0) this.gameOver();
    }

    updatePlayerActions(time, delta) {
        this.manaRegenTimer += delta;
        if (this.manaRegenTimer >= 10000) {
            this.player.mana = Math.min(this.player.maxMana, this.player.mana + 10);
            this.manaRegenTimer = 0;
            this.updateStatusUI();
        }

        if (this.player.spinneretLevel > 0) {
            this.aimArrow.setVisible(true).setPosition(this.player.x, this.player.y).setRotation(this.player.aimAngle);
            if (time > this.lastShootTime + 250 && Phaser.Input.Keyboard.JustDown(this.magicKey)) {
                this.shootWeb();
                this.lastShootTime = time;
            }
        } else {
            this.aimArrow.setVisible(false);
        }

        // Handle Melee Combat Over Distances (Inside Attack Barrier: 2 ransoms = 64)
        let targetRansom = null;
        let shortestDist = 150; // Increased range from 64

        this.ransoms.getChildren().forEach(r => {
            if (!r.active || r.isAttacking) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, r.x, r.y);
            if (dist < shortestDist) {
                targetRansom = r;
                shortestDist = dist;
            }
        });

        if (targetRansom && !this.dialogueBox.visible) {
            this.setInteractionText('[.] Atacar');
            if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
                targetRansom.takeDamage((this.player.clawLevel > 1) ? 40 : 10);
            }
        }
    }

    shootWeb() {
        if (this.player.mana >= 10) {
            this.player.mana -= 10;
            this.updateStatusUI();
            if (this.webs.countActive(true) >= 10) return; // Limit active projectiles
            const web = this.webs.create(this.player.x, this.player.y, 'web-bullet');
            web.hasHit = false; // Initialize hasHit flag

            // Defend against missing properties if not fully ready
            if (web && web.body) {
                web.setRotation(this.player.aimAngle);
                web.setVelocity(Math.cos(this.player.aimAngle) * 600, Math.sin(this.player.aimAngle) * 600);

                // Keep reference to timer for safety, verify scene context
                this.time.delayedCall(2000, () => {
                    if (web && web.scene && web.active) web.destroy();
                });
            }
        }
    }

    hitRansom(web, ransom) {
        if (!web || !web.active || web.hasHit || !ransom || !ransom.active) return;

        // Immediately mark as hit to prevent re-entry
        web.hasHit = true;
        console.log('Fieira hit detected! Target:', ransom.isBoss ? 'Boss' : 'Minion');

        // Disable physics and hide immediately to prevent staying inside collider
        web.disableBody(true, true);

        if (!ransom.isAttacking) {
            ransom.takeDamage(15);
        }

        // Clean up safely after physics step
        this.time.delayedCall(5, () => {
            if (web) web.destroy();
        });
    }

    updateShops() {
        if (this.dialogueBox.visible && !this.isWeaponShopOpen && !this.isExchangeOpen) return;

        const distShop = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shop.x, this.shop.y);
        const distWeaponShop = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.weaponShop.x, this.weaponShop.y);
        const threshold = 128; // ~4 ransoms

        // Logic for Weapon Shop (ARMAS)
        if (distWeaponShop < threshold) {
            if (!this.isWeaponShopOpen) {
                this.setInteractionText('[E] Abrir Loja de Armas');
                if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
                    this.openWeaponShop();
                    this.setInteractionText('');
                }
            }
        } else if (this.isWeaponShopOpen) {
            this.closeWeaponShop();
        }

        // Logic for Body Exchange (TROCA)
        if (distShop < threshold) {
            if (!this.isExchangeOpen) {
                this.setInteractionText('[E] Entregar Corpos');
                if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
                    this.visitShop();
                    this.setInteractionText('');
                }
            }
        } else if (this.isExchangeOpen) {
            if (distShop > threshold + 20) {
                this.isExchangeOpen = false;
                this.dialogueBox.setVisible(false);
            }
        }

        // Clear interaction text if moved away
        if (distShop >= threshold && distWeaponShop >= threshold) {
            this.setInteractionText('');
        }
    }

    closeWeaponShop() {
        this.dialogueBox.setVisible(false);
        this.isWeaponShopOpen = false;
        if (this.shopKeyListener) {
            this.input.keyboard.off('keydown', this.shopKeyListener);
            this.shopKeyListener = null;
        }
    }

    openWeaponShop() {
        if (this.isWeaponShopOpen) return;
        this.isWeaponShopOpen = true;
        this.updateWeaponShopDialogue();

        this.shopKeyListener = (event) => {
            if (!this.isWeaponShopOpen) return;

            const key = event.key.toLowerCase();
            const code = event.code;

            if (key === 'w' || code === 'ArrowUp') {
                this.shopSelection = (this.shopSelection - 1 + 3) % 3;
                this.updateWeaponShopDialogue();
            }
            else if (key === 's' || code === 'ArrowDown') {
                this.shopSelection = (this.shopSelection + 1) % 3;
                this.updateWeaponShopDialogue();
            }
            else if (key === 'enter') {
                this.buySelectedItem();
            }
        };
        this.input.keyboard.on('keydown', this.shopKeyListener);
    }

    updateWeaponShopDialogue() {
        const items = [
            `Fieira Aprimorada - 100 Moedas`,
            `Garras Aprimoradas - 150 Moedas`,
            `Restaurar HP (+20) - 20 Moedas`
        ];
        let menuText = "ARMAZÉM DE COMBATE\n(W/S para selecionar, Enter para comprar)\n\n";
        items.forEach((item, i) => {
            menuText += (this.shopSelection === i ? "> " : "  ") + item + "\n";
        });
        this.showDialogue(menuText);
    }

    buySelectedItem() {
        if (this.shopSelection === 0) { // Fieira
            if (this.player.spinneretLevel === 0 && this.coins >= 100) {
                this.coins -= 100;
                this.player.spinneretLevel = 1;
                this.updateCoinsUI();
                this.showDialogue("Fieira comprada! Pressione ç para disparar.\n(Purchase something else?)");
            } else {
                this.showDialogue(this.player.spinneretLevel > 0 ? "Você já tem a Fieira." : "Moedas insuficientes (100).");
            }
        } else if (this.shopSelection === 1) { // Garras
            if (this.player.clawLevel === 1 && this.coins >= 150) {
                this.coins -= 150;
                this.player.clawLevel = 2; // Nível 2 = Dano x4
                this.updateCoinsUI();
                this.showDialogue("Garras Aprimoradas compradas!\n(Purchase something else?)");
            } else {
                this.showDialogue(this.player.clawLevel > 1 ? "Você já tem as Garras." : "Moedas insuficientes (150).");
            }
        } else if (this.shopSelection === 2) { // HP
            if (this.coins >= 20) {
                this.coins -= 20;
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
                this.updateCoinsUI();
                this.updateStatusUI();
                this.showDialogue("HP Restaurado!\n(Purchase something else?)");
            } else {
                this.showDialogue("Moedas insuficientes (20).");
            }
        }
    }

    updateCoinsUI() {
        if (this.coinsText) this.coinsText.setText('Moedas: ' + this.coins);
    }

    updateNPCs() {
        let near = false; this.activeNPC = null;
        this.npcs.getChildren().forEach(npc => {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) < 100) { near = true; this.activeNPC = npc; }
        });
        if (near && !this.dialogueBox.visible) {
            this.setInteractionText('[E] Falar');
            if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.showDialogue(this.activeNPC.dialogue);
        } else if (!near) {
            // Only clear text/dialogue if it's NOT a shop that's currently open
            if (!this.isWeaponShopOpen && !this.isExchangeOpen) {
                this.setInteractionText('');
                if (this.dialogueBox.visible) this.dialogueBox.setVisible(false);
            }
        }
    }

    showDialogue(text) { this.dialogueText.setText(text); this.dialogueBox.setVisible(true); this.setInteractionText(''); }

    setInteractionText(text) {
        if (this.lastInteractionText === text) return;
        this.lastInteractionText = text;
        this.interactionText.setText(text).setVisible(text !== '');
    }

    updateStatusUI() {
        const hp = Math.max(0, Math.floor(this.player.hp));
        const mana = Math.floor(this.player.mana);
        this.statusText.setText(`HP: ${hp} | MANA: ${mana}`);
    }

    handleRansomCombat(player, ransom) {
        if (!ransom || !ransom.active) return;
        if (ransom.isAttacking) {
            this.damagePlayer(0.5);
        }
    }

    collectRansom(player, ransom) {
        if (!ransom || !ransom.active) return;

        // Remove from physics checks and render cleanly
        ransom.disableBody(true, true);

        if (ransom.isBoss) {
            this.showDialogue("O Rei Ransom caiu...");
            this.coins += 50;
            if (this.coinsText) this.coinsText.setText('Moedas: ' + this.coins);
        }

        this.score += 1;
        if (this.scoreText) this.scoreText.setText('Ransoms: ' + this.score);

        // Safe destruction delayed slightly to prevent massive console lag
        this.time.delayedCall(10, () => {
            if (ransom) ransom.destroy();
        });
    }

    damagePlayer(amount) {
        this.player.hp -= amount;
        if (this.player.hp < 0) this.player.hp = 0;
        this.updateStatusUI();
        if (!this.isBeingDamaged) {
            this.isBeingDamaged = true;
            this.player.setAlpha(0.5);
            this.time.delayedCall(200, () => {
                if (this.player && !this.player.isDead) this.player.setAlpha(1);
                this.isBeingDamaged = false;
            });
        }
    }

    gameOver() {
        this.player.isDead = true; this.player.setVelocity(0).setAlpha(0.5); this.physics.pause();
        this.add.text(400, 300, 'VOCÊ FOI CONSUMIDO\n[R] Reiniciar', { fontSize: '32px', fill: '#ff0000', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(5000);
        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }

    visitShop() {
        this.isExchangeOpen = true;
        if (this.score > 0) {
            const reward = this.score * 10;
            this.coins += reward;
            this.coinsText.setText('Moedas: ' + this.coins);
            this.showDialogue(`Nice doing business.\nEntregou ${this.score} corpos.`);
            this.score = 0;
            this.scoreText.setText('Ransoms: 0');
        } else {
            this.showDialogue("Você não tem corpos para entregar.");
        }
    }

    updateEnvironmentEffect() {
        if (!this.player || !this.archangel || !this.background) return;

        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.archangel.x, this.archangel.y);
        const radius = 800; // Effect starts at this distance

        if (dist < radius) {
            const factor = 1 - (dist / radius); // 0 (far) to 1 (close)
            
            // Background becomes "prettier" (lighter and golden)
            const r = Math.floor(68 + (255 - 68) * factor);
            const g = Math.floor(68 + (255 - 68) * factor);
            const b = Math.floor(68 + (200 - 68) * factor); // Less blue for a golden feel
            this.background.setTint(Phaser.Display.Color.GetColor(r, g, b));
            this.background.setAlpha(0.6 + (0.4 * factor));

            // Draw a glowing aura
            this.archangelGlow.clear();
            this.archangelGlow.fillStyle(0xffffaa, 0.2 * factor);
            this.archangelGlow.fillCircle(this.archangel.x, this.archangel.y, 200 * factor);
            this.archangelGlow.fillStyle(0xffffff, 0.1 * factor);
            this.archangelGlow.fillCircle(this.archangel.x, this.archangel.y, 400 * factor);
        } else {
            this.background.setTint(0x222222);
            this.background.setAlpha(0.6);
            this.archangelGlow.clear();
        }
    }
}
