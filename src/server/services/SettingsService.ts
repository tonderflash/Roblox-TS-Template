import { Service, OnStart } from "@flamework/core";
import { Events } from "server/network";
import { store } from "server/store";
import { Setting } from "shared/configs/Settings";
import { 
    safeValidate, 
    validateSetting 
} from "./resources/types/ResourceServiceTypes";

@Service({})
export class SettingsService implements OnStart {
    onStart() {
        Events.toggleSetting.connect((player, setting) => {
            const validSetting = safeValidate(
                validateSetting,
                setting,
                "toggleSetting.setting"
            );

            if (!validSetting) {
                warn(`[SettingsService] toggleSetting: Setting inválido de ${player.Name}`);
                return;
            }

            this.toggleSetting(player, validSetting);
        });
    }

    private toggleSetting ( player: Player, setting: Setting ) {
        store.toggleSetting( tostring( player.UserId ), setting )
    }
}
