import React from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import styles from '@/styles/footer.module.scss';
import images from '@/img/Logo-IT.png';
const Footer: React.FC = () => {
  return (
    <footer className={styles['about-footer']}>
      <div className={styles['footer-container']}>
        <div className={styles['footer-section']}>
          <h3>Về chúng tôi</h3>
         
          <p className={styles['company-name']}>Vieclam24h.vn - Công Ty Cổ Phần Việc Làm 24h</p>
          <p>Địa chỉ: Trường Đại học Công Nghiệp TP.HCM</p>
          <p>Điện thoại : (028) 969 6987 || (028) 987 8965</p>
          <p>Email: itvieclam@gmail.com</p>
        </div>
     
        <div className={styles['footer-section']}>
          <h3>Thông tin</h3>
          <ul className={styles['info-list']}>
            <li><a href="#">Cẩm nang nghề nghiệp</a></li>
            <li><a href="#">Chính sách đã liệu cỡ nhân</a></li>
            <li><a href="#">Tuân thủ và sự đồng ý của Khách Hàng</a></li>
          </ul>
        </div>

        <div className={styles['footer-section']}>
          <h3>Kết nối với chúng tôi</h3>
          <div className={styles['social-icons']}>
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaLinkedinIn /></a>
            <a href="#"><FaYoutube /></a>
          </div>
        </div>
       
      </div>
      
    </footer>
    
  );
};

export default Footer;