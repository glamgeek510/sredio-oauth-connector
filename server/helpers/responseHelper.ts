import { Response } from 'express';

export const dataOrgResponse = (res: Response, data: any = {}) => {
  res.status(200).json({ success: true, data });
};

export const redirectResponse = (res: Response, slug: string) => {
  if(slug) {
    res.redirect(`${process.env.FRONTEND_URL}/${slug}`);
  }
  res.redirect(`${process.env.FRONTEND_URL}`);
};

export const successResponse = (res: Response, message: any, data: any = {}) => {
  res.status(200).json({ success: true, message: message, data: data });
};

export const errorResponse = (res: Response, message: string, statusCode = 500) => {
  res.status(statusCode).json({ success: false, message });
};