import Avatar from "./Avatar";
import styles from "./UserBadge.module.css";

type UserBadgeProps = {
  name: string;
  alias?: string;
  avatarUrl?: string;
};

const UserBadge = ({ name, alias, avatarUrl }: UserBadgeProps) => {
  return (
    <div className={styles.badge}>
      <Avatar src={avatarUrl} name={name} size={36} />
      <div className={styles.meta}>
        <span className={styles.name}>{name}</span>
        {alias ? <span className={styles.alias}>{alias}</span> : null}
      </div>
    </div>
  );
};

export default UserBadge;
