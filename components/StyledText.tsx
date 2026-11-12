import { Text, TextProps } from './Themed';
import { fonts } from '@/constants/Colors';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[{ fontFamily: fonts.medium }, props.style]} />;
}
