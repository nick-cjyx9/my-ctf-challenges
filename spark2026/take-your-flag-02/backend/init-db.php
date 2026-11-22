<?php

declare(strict_types=1);

$dsn = sprintf(
    'mysql:host=%s;dbname=%s;charset=utf8mb4',
    getenv('DB_HOST') ?: '127.0.0.1',
    getenv('DB_NAME') ?: 'chichibu_shop',
);
$pdo = new PDO($dsn, getenv('DB_USER') ?: 'ctf', getenv('DB_PASSWORD') ?: 'ctf_password', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$pdo->exec('CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(180) NOT NULL UNIQUE, description VARCHAR(255) NOT NULL, price VARCHAR(32) NOT NULL, image VARCHAR(255) NOT NULL)');
$columns = $pdo->query('SHOW COLUMNS FROM products')->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('price', $columns, true)) {
    $pdo->exec("ALTER TABLE products ADD COLUMN price VARCHAR(32) NOT NULL DEFAULT 'JPY --'");
}
if (!in_array('image', $columns, true)) {
    $pdo->exec("ALTER TABLE products ADD COLUMN image VARCHAR(255) NOT NULL DEFAULT ''");
}
$uniqueNameIndex = $pdo->query("SHOW INDEX FROM products WHERE Column_name = 'name' AND Non_unique = 0")->fetchColumn();
if ($uniqueNameIndex === false) {
    $pdo->exec('ALTER TABLE products ADD UNIQUE INDEX products_name_unique (name)');
}
$pdo->exec('CREATE TABLE IF NOT EXISTS flag (flag VARCHAR(255) NOT NULL)');

{
    $insert = $pdo->prepare('INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description), price = VALUES(price), image = VALUES(image)');
    foreach ([
        ['秩父麦酒 ペールエール 華熊', '秩父本地精酿，柔和麦芽与柑橘香气。', 'JPY 680', '/images/hanakuma.jpeg'],
        ['秩父ワイン 源作印 巨峰 ロゼ', '以巨峰酿造的秩父产桃红葡萄酒，720ml。', 'JPY 1,760', '/images/genzaku-rose.png'],
        ['秩父錦 純米大吟醸', '秩父锦的纯米大吟酿，适合冷饮。', 'JPY 2,200', '/images/chichibu-nishiki.png'],
        ['ヴィーニャ･アデライダ カバ ブリュット・ナチュール レセルバ', '西班牙卡瓦起泡酒，干型珍藏款。', 'JPY 2,980', '/images/cava.jpg'],
        ['アサヒスーパードライ', '清爽干净的日式拉格啤酒。', 'JPY 280', '/images/asahi.jpg'],
        ['三井の寿 純米吟醸 ＋14大辛口', '辛口纯米吟酿，米旨感清晰。', 'JPY 1,650', '/images/miinokotobuki.jpg'],
        ['塩田酒造 芋焼酎 六代目百合', '鹿儿岛芋烧酎，香气饱满。', 'JPY 1,430', '/images/yuri.jpg'],
        ['喜久盛酒造 タクシードライバー 純米生原酒', '新鲜有力的纯米生原酒。', 'JPY 1,760', '/images/taxi.jpg'],
        ['百年の孤独', '橡木桶熟成麦烧酎。', 'JPY 3,300', '/images/hyakunen.webp'],
        ['Bovet La Valote Absinthe Émeraude 50cl', '瑞士苦艾酒，草本层次鲜明。', 'JPY 7,200', '/images/absinthe.jpg'],
        ['ブリュードッグ パンクIPA', '苏格兰精酿 IPA，柑橘与松针风味。', 'JPY 420', '/images/punk-ipa.jpg'],
        ['新澤醸造 伯楽星 純米吟醸', '宫城纯米吟酿，收口轻快。', 'JPY 1,870', '/images/hakurakusei.webp'],
    ] as $product) {
        $insert->execute($product);
    }
}

$pdo->exec('TRUNCATE TABLE flag');
$pdo->prepare('INSERT INTO flag (flag) VALUES (?)')->execute([getenv('FLAG')]);
