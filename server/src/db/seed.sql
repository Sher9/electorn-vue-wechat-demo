-- 插入测试用户
INSERT INTO users (id, username, avatar, created_at) VALUES
('u1', '张三', 'https://api.multiavatar.com/zhang.png', NOW()),
('u2', '李四', 'https://api.multiavatar.com/li.png', NOW()),
('u3', '王五', 'https://api.multiavatar.com/wang.png', NOW()),
('u4', '赵六', 'https://api.multiavatar.com/zhao.png', NOW()),
('u5', '孙七', 'https://api.multiavatar.com/sun.png', NOW());

-- 插入联系人关系
INSERT INTO contacts (id, user_id, contact_id, created_at) VALUES
('c1', 'u1', 'u2', NOW()),
('c2', 'u1', 'u3', NOW()),
('c3', 'u1', 'u4', NOW()),
('c4', 'u2', 'u1', NOW()),
('c5', 'u2', 'u3', NOW()),
('c6', 'u3', 'u1', NOW()),
('c7', 'u4', 'u1', NOW());


-- 创建私聊
INSERT INTO chats (id, user_id, participant_id, is_group, created_at) VALUES
('c1', 'u1', 'u2', FALSE, NOW()),
('c2', 'u2', 'u1', FALSE, NOW()),
('c3', 'u1', 'u3', FALSE, NOW()),
('c4', 'u3', 'u1', FALSE, NOW());

-- 创建群聊
INSERT INTO chats (id, user_id, group_id, is_group, created_at) VALUES
('c5', 'u1', 'g1', TRUE, NOW()),
('c6', 'u2', 'g1', TRUE, NOW()),
('c7', 'u3', 'g1', TRUE, NOW()),
('c8', 'u1', 'g2', TRUE, NOW()),
('c9', 'u2', 'g2', TRUE, NOW());

-- 创建群组
INSERT INTO chat_groups (id, name, avatar, owner_id, created_at) VALUES
('g1', '技术交流群', 'https://api.multiavatar.com/group1.png', 'u1', NOW()),
('g2', '周末约饭群', 'https://api.multiavatar.com/group2.png', 'u2', NOW());


-- 插入私聊消息
INSERT INTO messages (id, chat_id, sender_id, content, type, created_at) VALUES
('m1', 'c1', 'u1', '你好，最近怎么样？', 'text', NOW()),
('m2', 'c1', 'u2', '挺好的，你呢？', 'text', NOW()),
('m3', 'c3', 'u1', '周末有空吗？', 'text', NOW()),
('m4', 'c3', 'u3', '有的，怎么了？', 'text', NOW());

-- 插入群聊消息
INSERT INTO messages (id, chat_id, sender_id, content, type, created_at) VALUES
('m5', 'c5', 'u1', '大家好，欢迎加入技术交流群！', 'text', NOW()),
('m6', 'c5', 'u2', '很高兴认识大家！', 'text', NOW()),
('m7', 'c5', 'u3', '有人了解Vue3吗？', 'text', NOW()),
('m8', 'c8', 'u2', '周末去哪吃？', 'text', NOW()),
('m9', 'c8', 'u1', '我知道一家不错的火锅', 'text', NOW());

-- 更新最后一条消息
UPDATE chats c1
JOIN messages m1 ON c1.id = m1.chat_id
LEFT JOIN messages m2 ON c1.id = m2.chat_id AND m1.created_at < m2.created_at
SET c1.last_message_id = m1.id
WHERE m2.id IS NULL;

-- 插入群组成员
INSERT INTO group_members (id, group_id, user_id, role, joined_at) VALUES
('gm1', 'g1', 'u1', 'owner', NOW()),
('gm2', 'g1', 'u2', 'member', NOW()),
('gm3', 'g1', 'u3', 'member', NOW()),
('gm4', 'g1', 'u4', 'member', NOW()),
('gm5', 'g2', 'u2', 'owner', NOW()),
('gm6', 'g2', 'u1', 'member', NOW()),
('gm7', 'g2', 'u3', 'member', NOW());

-- 插入朋友圈
INSERT INTO moments (id, user_id, content, type, created_at) VALUES
('mm1', 'u1', '今天天气真好！', 'text', NOW()),
('mm2', 'u2', '分享一张美食照片', 'image', NOW()),
('mm3', 'u3', '新项目开始了！', 'text', NOW());

-- 插入朋友圈图片
INSERT INTO moment_images (id, moment_id, url, created_at) VALUES
('mi1', 'mm2', 'https://example.com/food1.jpg', NOW()),
('mi2', 'mm2', 'https://example.com/food2.jpg', NOW());

-- 插入朋友圈点赞
INSERT INTO moment_likes (id, moment_id, user_id, created_at) VALUES
('ml1', 'mm1', 'u2', NOW()),
('ml2', 'mm1', 'u3', NOW()),
('ml3', 'mm2', 'u1', NOW());

-- 插入朋友圈评论
INSERT INTO moment_comments (id, moment_id, user_id, content, created_at) VALUES
('mc1', 'mm1', 'u2', '确实不错！', NOW()),
('mc2', 'mm1', 'u3', '羡慕啊~', NOW()),
('mc3', 'mm2', 'u1', '看起来很美味', NOW());