import { LensHub } from '@hey/abis';
import logger from '@hey/lib/logger';
import { CACHE_AGE_INDEFINITE } from '@utils/constants';
import type { Handler } from 'express';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

export const get: Handler = async (req, res) => {
  try {
    const alchemyUrl = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    const client = createPublicClient({
      chain: polygon,
      transport: http(alchemyUrl)
    });

    const data: any = await client.readContract({
      address: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
      abi: LensHub,
      functionName: 'tokenURI',
      args: [req.query.id]
    });

    const jsonData = JSON.parse(
      Buffer.from(data.split(',')[1], 'base64').toString()
    );

    const base64Image = jsonData.image.split(';base64,').pop();
    const svgImage = Buffer.from(base64Image, 'base64').toString('utf-8');
    logger.info(`Downloaded Lenny avatar for ${req.query.id}`);

    return res
      .status(200)
      .setHeader('Cache-Control', CACHE_AGE_INDEFINITE)
      .type('svg')
      .send(svgImage);
  } catch {
    const url =
      'https://i.seadn.io/s/raw/files/b7a5afa354adaf5f988acd8b0ba2409e.jpg';
    return res.status(302).redirect(url);
  }
};
