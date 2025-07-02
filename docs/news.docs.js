/**
 * @swagger
 * tags:
 *   name: News
 *   description: News management APIs
 */

/**
 * @swagger
 * /news:
 *   post:
 *     summary: Create a news post
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       201:
 *         description: News created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/News'
 */

/**
 * @swagger
 * /news:
 *   get:
 *     summary: Get all news posts
 *     tags: [News]
 *     responses:
 *       200:
 *         description: List of news
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/News'
 */

/**
 * @swagger
 * /news/{id}:
 *   get:
 *     summary: Get news by ID
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: News ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/News'
 *       404:
 *         description: News not found
 */

/**
 * @swagger
 * /news/{id}:
 *   put:
 *     summary: Update a news post
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: News ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/News'
 *     responses:
 *       200:
 *         description: News updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/News'
 *       404:
 *         description: News not found
 */

/**
 * @swagger
 * /news/{id}:
 *   delete:
 *     summary: Delete a news post
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: News ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News deleted
 *       404:
 *         description: News not found
 */

/**
 * @swagger
 * /news/{id}/publish:
 *   patch:
 *     summary: Toggle publish status of news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: News ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Publish status updated
 */
