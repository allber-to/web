/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useColorScheme } from '$app/common/colors';
import { AllbertoLogo } from '$app/components/AllbertoLogo';
import { Link } from '../../../components/forms/Link';

export function Header() {
  const colors = useColorScheme();

  return (
    <div
      className="ab-auth-header flex justify-center py-8"
      style={{ color: colors.$3 }}
    >
      <Link to="/" className="ab-auth-logo" withoutDefaultStyling>
        <AllbertoLogo />
      </Link>
    </div>
  );
}
