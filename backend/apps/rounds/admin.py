from django.contrib import admin
from .models import Answer, Prediction, MatchResult, ProfileVersion, ConsentLog

admin.site.register(Answer)
admin.site.register(Prediction)
admin.site.register(MatchResult)
admin.site.register(ProfileVersion)
admin.site.register(ConsentLog)
